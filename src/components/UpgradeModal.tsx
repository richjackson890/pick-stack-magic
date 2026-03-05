import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Archive, Brain, Share2, Zap } from 'lucide-react';
import { useTossPayments } from '@/hooks/useTossPayments';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'items' | 'ai' | 'general';
}

const benefits = [
  { icon: Archive, text: '무제한 저장', description: '원하는 만큼 콘텐츠를 저장하세요' },
  { icon: Brain, text: '무제한 AI 분석', description: '모든 콘텐츠를 자동으로 분석' },
  { icon: Share2, text: '고급 공유 기능', description: '컬렉션 공유 및 협업' },
  { icon: Sparkles, text: '광고 없음', description: '깔끔한 사용 경험' },
];

export function UpgradeModal({ isOpen, onClose, reason = 'general' }: UpgradeModalProps) {
  const { requestPayment, loading } = useTossPayments();

  const getTitle = () => {
    switch (reason) {
      case 'items': return '저장 공간이 부족해요';
      case 'ai': return 'AI 분석 횟수를 모두 사용했어요';
      default: return 'Pro로 업그레이드';
    }
  };

  const getDescription = () => {
    switch (reason) {
      case 'items': return '무료 플랜의 저장 한도에 도달했습니다. Pro로 업그레이드하여 무제한으로 저장하세요.';
      case 'ai': return '이번 달 AI 분석 횟수를 모두 사용했습니다. Pro로 업그레이드하면 무제한으로 분석할 수 있어요.';
      default: return 'Pro 플랜으로 업그레이드하여 모든 기능을 제한 없이 사용하세요.';
    }
  };

  const handleUpgrade = async () => {
    await requestPayment({
      type: 'subscription',
      amount: 3900,
      orderName: 'PickStack Pro 구독',
    });
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full glass-button hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">{getTitle()}</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">{getDescription()}</p>

              <div className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{benefit.text}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mb-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">₩3,900</span>
                  <span className="text-muted-foreground">/월</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">언제든 취소 가능</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={handleUpgrade}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-colors shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>처리 중...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Pro 시작하기
                  </>
                )}
              </motion.button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                토스페이먼츠로 안전하게 결제됩니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
