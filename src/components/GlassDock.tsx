import { motion } from 'framer-motion';
import { Home, Plus, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassDockProps {
  currentTab: 'home' | 'report' | 'dashboard';
  onTabChange: (tab: 'home' | 'report' | 'dashboard') => void;
  onAdd: () => void;
}

export function GlassDock({ currentTab, onTabChange, onAdd }: GlassDockProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-dock safe-area-pb">
      <div className="container flex items-center justify-around py-2 max-w-md mx-auto">
        {/* Home Tab */}
        <motion.button
          onClick={() => onTabChange('home')}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors',
            currentTab === 'home' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <motion.div
            animate={{
              scale: currentTab === 'home' ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Home className="h-5 w-5" />
          </motion.div>
          <span className="text-2xs font-medium">홈</span>
          
          {/* Neon Underline */}
          {currentTab === 'home' && (
            <motion.div
              layoutId="dock-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))',
                boxShadow: '0 0 10px hsl(var(--neon-purple) / 0.6)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Add Button - Floating with Glow */}
        <motion.button
          onClick={onAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="relative -mt-6"
        >
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
                '0 0 30px hsl(var(--primary) / 0.6), 0 0 60px hsl(var(--primary) / 0.3)',
                '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="relative w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        {/* AI Report Tab */}
        <motion.button
          onClick={() => onTabChange('report')}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors',
            currentTab === 'report' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <motion.div
            animate={{
              scale: currentTab === 'report' ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <span className="text-2xs font-medium">AI 리포트</span>
          
          {/* Neon Underline */}
          {currentTab === 'report' && (
            <motion.div
              layoutId="dock-indicator"
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))',
                boxShadow: '0 0 10px hsl(var(--neon-purple) / 0.6)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      </div>
    </nav>
  );
}
