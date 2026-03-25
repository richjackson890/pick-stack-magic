import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTeam } from '@/hooks/useTeam';
import { LiquidSpinner } from '@/components/LiquidSpinner';

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { acceptInvite } = useTeam();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link');
      return;
    }

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
  }, [searchParams, acceptInvite, navigate]);

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
