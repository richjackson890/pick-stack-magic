import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function GlassSheet({ isOpen, onClose, children, title }: GlassSheetProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const scale = useTransform(y, [0, 200], [1, 0.95]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ y, opacity, scale }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-hidden"
          >
            <div className="glass-sheet rounded-t-3xl">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <motion.div 
                  className="w-10 h-1 rounded-full bg-muted-foreground/30"
                  whileHover={{ width: 48, backgroundColor: 'hsl(var(--muted-foreground) / 0.5)' }}
                />
              </div>
              
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              )}
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-glass">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
