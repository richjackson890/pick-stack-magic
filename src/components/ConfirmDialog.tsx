import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title = '삭제 확인',
  message = '정말 삭제하시겠습니까?',
  confirmLabel = '삭제',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="glass-card rounded-2xl p-5 w-80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                className="flex-1"
                variant={destructive ? 'destructive' : 'default'}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
