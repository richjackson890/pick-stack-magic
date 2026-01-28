import { motion } from 'framer-motion';
import { Plus, Bookmark, Share2, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Hero Illustration */}
      <motion.div 
        className="relative mb-8"
        animate={{ 
          y: [0, -8, 0],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      >
        <motion.div 
          className="w-24 h-24 rounded-3xl glass flex items-center justify-center neon-glow"
          animate={{
            boxShadow: [
              '0 0 20px hsl(var(--neon-purple) / 0.3)',
              '0 0 40px hsl(var(--neon-purple) / 0.5)',
              '0 0 20px hsl(var(--neon-purple) / 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Bookmark className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.div 
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        첫 번째 콘텐츠를 저장해보세요!
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        관심 있는 콘텐츠를 저장하면<br />AI가 자동으로 분류하고 요약해드려요
      </p>

      {/* How to use guide */}
      <div className="w-full max-w-sm mb-8 space-y-3">
        {[
          { num: 1, title: '콘텐츠 공유하기', desc: 'Instagram, YouTube 등에서 공유 버튼 → PickStack 선택' },
          { num: 2, title: 'AI가 자동 분석', desc: '제목, 카테고리, 3줄 요약을 자동 생성' },
          { num: 3, title: '저장 완료!', desc: '한 번의 탭으로 저장하고 언제든 다시 확인' },
        ].map((step, index) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-3 text-left p-3 rounded-xl glass-card"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">{step.num}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddClick}
        className="gradient-primary px-6 py-3 rounded-2xl font-semibold text-white flex items-center gap-2 neon-glow-orange"
      >
        <Share2 className="w-4 h-4" />
        직접 추가하기
        <ArrowRight className="w-4 h-4" />
      </motion.button>

      <p className="mt-4 text-xs text-muted-foreground">
        또는 다른 앱에서 공유 → PickStack 선택
      </p>
    </motion.div>
  );
}
