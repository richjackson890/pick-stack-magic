import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/useTeam';
import { LiquidSpinner } from '@/components/LiquidSpinner';

const PENDING_INVITE_KEY = 'pending_invite_token';

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { acceptInvite } = useTeam();
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

    localStorage.removeItem(PENDING_INVITE_KEY);

    acceptInvite(token).then((success) => {
      if (success) {
        setStatus('success');
        setMessage('Successfully joined the team!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('error');
        setMessage('Failed to join team. The invite may be expired.');
      }
    });
  }, [authLoading, user, searchParams, acceptInvite, navigate]);

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
