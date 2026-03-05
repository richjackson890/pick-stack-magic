import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    TossPayments?: any;
  }
}

// TOSS_CLIENT_KEY is stored as a secret but used in frontend via edge function
// For TossPayments SDK, the client key must be in frontend
// Users should set this to their actual client key
const TOSS_CLIENT_KEY = 'test_ck_26DIbXAaV06XXMgebOBx8qY50Q9R';

export interface PaymentOptions {
  type: 'subscription' | 'tip';
  amount: number;
  orderName: string;
}

export function useTossPayments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.TossPayments) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v2/standard';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
      document.head.appendChild(script);
    });
  }, []);

  const requestPayment = useCallback(async (options: PaymentOptions) => {
    if (!user) {
      setError('로그인이 필요합니다');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadSDK();

      const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: user.id });

      const orderId = `${options.type}_${user.id.slice(0, 8)}_${Date.now()}`;

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: options.amount,
        },
        orderId,
        orderName: options.orderName,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment/success?type=${options.type}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        // User cancelled, not an error
        setError(null);
      } else {
        setError(err.message || '결제 요청 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  }, [user, loadSDK]);

  const confirmPayment = useCallback(async (
    paymentKey: string,
    orderId: string,
    amount: number,
    paymentType: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('인증 세션이 없습니다');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/confirm-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), paymentType }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '결제 승인 실패');
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requestPayment,
    confirmPayment,
    loading,
    error,
  };
}
