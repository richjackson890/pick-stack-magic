import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';

interface PremiumFeatureGateProps {
  feature: string;
  description: string;
  onUpgrade: () => void;
  children: React.ReactNode;
  isPremium: boolean;
}

export function PremiumFeatureGate({ feature, description, onUpgrade, children, isPremium }: PremiumFeatureGateProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="filter blur-[6px] opacity-60 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="glass rounded-2xl p-5 text-center max-w-[240px] border border-amber-500/20">
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm font-semibold mb-1">{feature}</p>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          <button
            onClick={onUpgrade}
            className="flex items-center justify-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-yellow-600 transition-colors"
          >
            <Crown className="w-3.5 h-3.5" />
            Pro 시작하기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
