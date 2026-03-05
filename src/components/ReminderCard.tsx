import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ExternalLink } from 'lucide-react';
import { DbItem } from '@/hooks/useDbItems';

interface ReminderCardProps {
  items: DbItem[];
  onItemClick: (item: DbItem) => void;
  onDismiss: () => void;
  show: boolean;
}

export function ReminderCard({ items, onItemClick, onDismiss, show }: ReminderCardProps) {
  // Pick a random "forgotten" item saved 7+ days ago
  const reminderItem = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const oldItems = items.filter(i => new Date(i.created_at) < weekAgo && i.ai_status === 'done');
    if (oldItems.length === 0) return null;
    // Use date-based seed for consistent daily selection
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return oldItems[dayIndex % oldItems.length];
  }, [items]);

  if (!reminderItem || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="glass-card p-3 mb-3 relative overflow-hidden"
      >
        {/* Accent gradient stripe */}
        <div 
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))' }}
        />
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="h-4 w-4 text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-semibold text-accent mb-0.5">💡 다시 보기 추천</p>
            <h3 
              className="text-sm font-semibold text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onItemClick(reminderItem)}
            >
              {reminderItem.title}
            </h3>
            {reminderItem.summary_3lines?.[0] && (
              <p className="text-2xs text-muted-foreground line-clamp-1 mt-0.5">
                {reminderItem.summary_3lines[0]}
              </p>
            )}
            <p className="text-2xs text-muted-foreground/60 mt-1">
              {new Date(reminderItem.created_at).toLocaleDateString('ko-KR')}에 저장됨
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {reminderItem.url && (
              <motion.a
                href={reminderItem.url}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="glass-button w-7 h-7 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </motion.a>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              className="glass-button w-7 h-7 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
