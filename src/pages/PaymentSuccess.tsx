import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, Coffee, Loader2 } from 'lucide-react';
import { useTossPayments } from '@/hooks/useTossPayments';
import { useUsageLimits } from '@/hooks/useUsageLimits';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPayment, loading, error } = useTossPayments();
  const { refetch: refetchUsage } = useUsageLimits();
  const [confirmed, setConfirmed] = useState(false);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const paymentType = searchParams.get('type') || 'subscription';

  useEffect(() => {
    if (paymentKey && orderId && amount && !confirmed) {
      confirmPayment(paymentKey, orderId, Number(amount), paymentType)
        .then(() => {
          setConfirmed(true);
          refetchUsage();
        })
        .catch(() => {});
    }
  }, [paymentKey, orderId, amount, paymentType, confirmPayment, confirmed, refetchUsage]);

  const isSubscription = paymentType === 'subscription';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">결제 확인 중...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-lg font-bold mb-2">결제 승인 실패</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground"
          >
            홈으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-6"
        >
          {isSubscription ? (
            <Crown className="w-10 h-10 text-amber-500" />
          ) : (
            <Coffee className="w-10 h-10 text-amber-500" />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">
            {isSubscription ? '🎉 Pro 업그레이드 완료!' : '☕ 감사합니다!'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSubscription
              ? '이제 모든 프리미엄 기능을 무제한으로 사용할 수 있습니다.'
              : '따뜻한 후원에 감사드립니다. 더 좋은 서비스로 보답하겠습니다!'}
          </p>

          {isSubscription && (
            <div className="glass rounded-xl p-4 mb-6 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>무제한 콘텐츠 저장</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>무제한 AI 분석</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>광고 없는 깔끔한 환경</span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-colors"
          >
            시작하기
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
