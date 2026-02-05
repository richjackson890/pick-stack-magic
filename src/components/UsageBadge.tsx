import { motion } from 'framer-motion';
import { Sparkles, Archive, Brain, Crown } from 'lucide-react';
import { FREE_LIMITS } from '@/hooks/useUsageLimits';

interface UsageBadgeProps {
  itemsCount: number;
  aiAnalysisCount: number;
  isPremium: boolean;
  compact?: boolean;
}

export function UsageBadge({ itemsCount, aiAnalysisCount, isPremium, compact = false }: UsageBadgeProps) {
  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
      >
        <Crown className="w-3 h-3 text-amber-500" />
        <span className="text-xs font-medium text-amber-500">Pro</span>
      </motion.div>
    );
  }

  const itemsPercent = (itemsCount / FREE_LIMITS.MAX_ITEMS) * 100;
  const aiPercent = (aiAnalysisCount / FREE_LIMITS.MAX_AI_ANALYSIS_PER_MONTH) * 100;
  
  const isItemsLow = itemsPercent >= 80;
  const isAiLow = aiPercent >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-xs ${isItemsLow ? 'text-orange-500' : 'text-muted-foreground'}`}>
          <Archive className="w-3 h-3" />
          <span>{itemsCount}/{FREE_LIMITS.MAX_ITEMS}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${isAiLow ? 'text-orange-500' : 'text-muted-foreground'}`}>
          <Brain className="w-3 h-3" />
          <span>{aiAnalysisCount}/{FREE_LIMITS.MAX_AI_ANALYSIS_PER_MONTH}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Archive className="w-3 h-3" />
          저장 공간
        </span>
        <span className={`text-xs font-medium ${isItemsLow ? 'text-orange-500' : 'text-foreground'}`}>
          {itemsCount} / {FREE_LIMITS.MAX_ITEMS}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(itemsPercent, 100)}%` }}
          className={`h-full rounded-full ${isItemsLow ? 'bg-orange-500' : 'bg-primary'}`}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Brain className="w-3 h-3" />
          AI 분석 (월간)
        </span>
        <span className={`text-xs font-medium ${isAiLow ? 'text-orange-500' : 'text-foreground'}`}>
          {aiAnalysisCount} / {FREE_LIMITS.MAX_AI_ANALYSIS_PER_MONTH}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(aiPercent, 100)}%` }}
          className={`h-full rounded-full ${isAiLow ? 'bg-orange-500' : 'bg-primary'}`}
        />
      </div>

      {(isItemsLow || isAiLow) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-2 mt-2 border-t border-border/50"
        >
          <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Pro로 업그레이드
            </span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
