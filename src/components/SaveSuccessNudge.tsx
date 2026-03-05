import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { FREE_LIMITS } from '@/hooks/useUsageLimits';

interface SaveSuccessNudgeProps {
  show: boolean;
  itemsCount: number;
  isPremium: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function SaveSuccessNudge({ show, itemsCount, isPremium, onUpgrade, onDismiss }: SaveSuccessNudgeProps) {
  if (isPremium || !show) return null;

  const percent = (itemsCount / FREE_LIMITS.MAX_ITEMS) * 100;
  const remaining = FREE_LIMITS.MAX_ITEMS - itemsCount;

  // Only show nudge when usage is significant
  if (percent < 40) return null;

  const getMessage = () => {
    if (percent >= 90) return { emoji: '🔥', text: `남은 저장 공간 ${remaining}개! 곧 한도에 도달해요`, urgent: true };
    if (percent >= 70) return { emoji: '📦', text: `저장 공간 ${Math.round(percent)}% 사용 중`, urgent: false };
    return { emoji: '✨', text: `${itemsCount}개 저장 완료!`, urgent: false };
  };

  const msg = getMessage();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className={`glass rounded-2xl p-4 border ${msg.urgent ? 'border-amber-500/40' : 'border-border/50'}`}>
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground text-xs p-1"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-xl">{msg.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{msg.text}</p>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${msg.urgent ? 'bg-amber-500' : 'bg-primary'}`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {itemsCount} / {FREE_LIMITS.MAX_ITEMS}개 사용
                </p>
              </div>
            </div>

            {percent >= 60 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onUpgrade}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 transition-colors text-amber-600 dark:text-amber-400"
              >
                <Crown className="w-3.5 h-3.5" />
                Pro로 무제한 저장하기
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
