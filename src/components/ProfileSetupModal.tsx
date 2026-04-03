import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const POSITION_OPTIONS = ['실장', '소원', '인턴', '기타'];

interface ProfileSetupModalProps {
  onComplete: () => Promise<void>;
}

export function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState('');

  const handleSave = async () => {
    if (!user || !displayName.trim() || !position) return;
    setSaving(true);
    await (supabase.from('profiles' as any).upsert({
      id: user.id,
      email: user.email,
      display_name: displayName.trim(),
      position,
    }, { onConflict: 'id' }) as any);
    setSaving(false);
    await onComplete();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="glass-card rounded-2xl p-6 w-full max-w-sm mx-4 space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-base font-bold">프로필 설정</h2>
          <p className="text-xs text-muted-foreground">팀에서 사용할 이름과 직급을 입력해주세요</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1 block">이름 *</label>
            <Input
              placeholder="표시될 이름 입력"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">직급 *</label>
            <div className="flex flex-wrap gap-1.5">
              {POSITION_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                    position === p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!displayName.trim() || !position || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장하고 시작하기'}
        </Button>
      </motion.div>
    </div>
  );
}
