import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Copy, Check, X, FolderOpen } from 'lucide-react';
import { useSharing } from '@/hooks/useSharing';
import { DbCategory } from '@/hooks/useDbCategories';
import { DbItem } from '@/hooks/useDbItems';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: DbCategory;
  items: DbItem[];
}

export function ShareCollectionModal({ isOpen, onClose, category, items }: ShareCollectionModalProps) {
  const { shareCollection, copyAndShare, isSharing } = useSharing();
  const [title, setTitle] = useState(category?.name || '나의 컬렉션');
  const [description, setDescription] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form');

  const handleShare = async () => {
    const itemIds = items.map(item => item.id);
    const url = await shareCollection(title, itemIds, category?.id, description);
    if (url) {
      setShareUrl(url);
      setStep('result');
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
          title: title,
          text: `${title} 컬렉션을 확인해보세요!`,
          url: shareUrl,
        });
        onClose();
      } catch {
        // User cancelled
      }
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setStep('form');
      setShareUrl(null);
      setCopied(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <div 
              className="glass-sheet rounded-2xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {step === 'form' ? '컬렉션 공유' : '공유 링크'}
                </h3>
                <button onClick={handleClose} className="glass-button w-8 h-8 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {step === 'form' ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">컬렉션 제목</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="컬렉션 이름"
                        className="glass-card border-border/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">설명 (선택)</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="컬렉션에 대한 설명을 입력하세요"
                        className="glass-card border-border/50 min-h-[60px]"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="glass-card p-3 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {category?.icon && <span className="text-lg">{category.icon}</span>}
                      <span className="font-medium text-foreground">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {items.length}개의 항목이 공유됩니다
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    disabled={isSharing || !title.trim()}
                    className="w-full gradient-primary py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSharing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Share2 className="h-4 w-4" />
                        </motion.div>
                        링크 생성 중...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        공유 링크 생성
                      </>
                    )}
                  </motion.button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    이 링크를 공유하면 누구나 컬렉션을 볼 수 있습니다
                  </p>

                  {/* URL Display */}
                  <div className="glass-card p-3 rounded-xl mb-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl || ''}
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
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
