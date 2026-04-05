import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LiquidSpinner } from '@/components/LiquidSpinner';

const PENDING_INVITE_KEY = 'pending_invite_token';

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    // Get token from URL or localStorage (after login redirect)
    const urlToken = searchParams.get('token');
    const pendingToken = localStorage.getItem(PENDING_INVITE_KEY);
    const token = urlToken || pendingToken;

    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link');
      return;
    }

    // Not logged in — save token and redirect to login
    if (!user) {
      localStorage.setItem(PENDING_INVITE_KEY, token);
      navigate('/auth', { replace: true });
      return;
    }

    // Logged in — process invite
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // Clear pending token immediately
    localStorage.removeItem(PENDING_INVITE_KEY);

    // Call RPC directly to avoid useTeam dependency issues
    (async () => {
      try {
        const { data, error } = await supabase.rpc('accept_team_invite', { invite_token: token });

        if (error) throw error;

        const result = typeof data === 'string' ? JSON.parse(data) : data;
        if (result?.error) throw new Error(result.error);

        // Delete the used invite token so it disappears from active links
        await (supabase
          .from('team_invites' as any)
          .delete()
          .eq('token', token) as any);

        setStatus('success');
        setMessage('팀에 합류했습니다! 팀장이 초대한 DLab 팀에 참여되었습니다.');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } catch (err: any) {
        console.error('[Invite] accept error:', err);
        setStatus('error');
        const isExpired = err.message?.toLowerCase().includes('expired') || err.message?.includes('만료');
        setMessage(isExpired
          ? '이 초대 링크는 만료되었습니다. 팀장에게 새 링크를 요청하세요.'
          : err.message || '팀 참여에 실패했습니다.');
      }
    })();
  }, [authLoading, user, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && <LiquidSpinner size="lg" />}
        {status === 'success' && <div className="text-4xl">✅</div>}
        {status === 'error' && <div className="text-4xl">❌</div>}
        <p className="text-sm text-muted-foreground">{message || 'Processing invite...'}</p>
      </div>
    </div>
  );
}
