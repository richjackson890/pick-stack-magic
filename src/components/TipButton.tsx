import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart, X } from 'lucide-react';
import { useTossPayments } from '@/hooks/useTossPayments';

const tipAmounts = [
  { amount: 1000, label: '☕ 커피 한 잔', emoji: '☕' },
  { amount: 3000, label: '🍰 커피 + 케이크', emoji: '🍰' },
  { amount: 5000, label: '🍱 점심 한 끼', emoji: '🍱' },
];

export function TipButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { requestPayment, loading } = useTossPayments();

  const handleTip = async (amount: number, label: string) => {
    await requestPayment({
      type: 'tip',
      amount,
      orderName: `PickStack 후원 - ${label}`,
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-full glass-button text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        title="개발자 후원"
      >
        <Coffee className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">후원</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
            >
              <div className="glass rounded-2xl p-6 relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full glass-button"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20 border border-pink-500/30">
                    <Heart className="w-7 h-7 text-pink-500" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-center mb-1">개발자에게 커피 사주기</h3>
                <p className="text-xs text-muted-foreground text-center mb-5">
                  PickStack을 만드는 데 힘이 됩니다 ☕
                </p>

                <div className="space-y-2">
                  {tipAmounts.map((tip) => (
                    <motion.button
                      key={tip.amount}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      onClick={() => handleTip(tip.amount, tip.label)}
                      className="w-full flex items-center justify-between p-3 rounded-xl glass-button hover:bg-muted/30 transition-colors disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-lg">{tip.emoji}</span>
                        {tip.label}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        ₩{tip.amount.toLocaleString()}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
                  일회성 결제이며 자동 갱신되지 않습니다
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
