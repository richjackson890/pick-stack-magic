import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Copy, Check, X } from 'lucide-react';
import { useSharing } from '@/hooks/useSharing';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  itemId: string;
  title?: string;
  variant?: 'icon' | 'button' | 'chip';
  className?: string;
}

export function ShareButton({ itemId, title, variant = 'icon', className }: ShareButtonProps) {
  const { shareItem, copyAndShare, isSharing } = useSharing();
  const [showDialog, setShowDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = await shareItem(itemId);
    if (url) {
      setShareUrl(url);
      setShowDialog(true);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      const success = await copyAndShare(shareUrl, title);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleNativeShare = async () => {
    if (shareUrl && navigator.share) {
      try {
        await navigator.share({
          title: title || 'PickStack 공유',
          text: `${title || '콘텐츠'}를 확인해보세요!`,
          url: shareUrl,
        });
        setShowDialog(false);
      } catch {
        // User cancelled
      }
    }
  };

  const buttonContent = () => {
    if (isSharing) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Share2 className="h-4 w-4" />
        </motion.div>
      );
    }
    return <Share2 className="h-4 w-4" />;
  };

  return (
    <>
      {variant === 'icon' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          disabled={isSharing}
          className={cn('glass-button w-8 h-8 flex items-center justify-center', className)}
        >
          {buttonContent()}
        </motion.button>
      )}

      {variant === 'button' && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          disabled={isSharing}
          className={cn('glass-button w-full py-3 font-medium flex items-center justify-center gap-2', className)}
        >
          {buttonContent()}
          공유하기
        </motion.button>
      )}

      {variant === 'chip' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          disabled={isSharing}
          className={cn('glass-chip px-3 py-1.5 text-sm font-medium flex items-center gap-1.5', className)}
        >
          {buttonContent()}
          공유
        </motion.button>
      )}

      {/* Share Dialog */}
      <AnimatePresence>
        {showDialog && shareUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm"
            >
              <div className="glass-sheet rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    공유 링크
                  </h3>
                  <button onClick={() => setShowDialog(false)} className="glass-button w-8 h-8 flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  이 링크를 공유하면 누구나 콘텐츠를 볼 수 있습니다
                </p>

                {/* URL Display */}
                <div className="glass-card p-3 rounded-xl mb-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-foreground outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="glass-button w-9 h-9 flex items-center justify-center"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopy}
                    className="flex-1 glass-button py-2.5 font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    링크 복사
                  </motion.button>
                  
                  {navigator.share && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNativeShare}
                      className="flex-1 gradient-primary py-2.5 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      공유하기
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
