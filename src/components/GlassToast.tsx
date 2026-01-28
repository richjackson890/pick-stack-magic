import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassToastProps {
  show: boolean;
  type: 'success' | 'error' | 'loading' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

const icons = {
  success: Check,
  error: AlertCircle,
  loading: Loader2,
  info: AlertCircle,
};

const iconColors = {
  success: 'text-neon-cyan',
  error: 'text-destructive',
  loading: 'text-neon-purple',
  info: 'text-muted-foreground',
};

export function GlassToast({ show, type, message, action, onClose }: GlassToastProps) {
  const Icon = icons[type];
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div className="glass-card px-4 py-3 flex items-center gap-3 max-w-sm pointer-events-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
              className={cn(
                'w-8 h-8 rounded-full glass flex items-center justify-center',
                type === 'success' && 'neon-glow-cyan',
                type === 'error' && 'border-destructive/30'
              )}
            >
              <Icon 
                className={cn(
                  'h-4 w-4',
                  iconColors[type],
                  type === 'loading' && 'animate-spin'
                )} 
              />
            </motion.div>
            
            <span className="flex-1 text-sm font-medium text-foreground">
              {message}
            </span>
            
            {action && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {action.label}
              </motion.button>
            )}
            
            {onClose && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
