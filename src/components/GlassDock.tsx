import { motion } from 'framer-motion';
import { Home, Plus, Sparkles, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'home' | 'creator' | 'report' | 'dashboard';

interface GlassDockProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAdd: () => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Tips', icon: Home },
  { id: 'creator', label: 'Team', icon: Users },
  { id: 'report', label: 'AI Report', icon: Sparkles },
  { id: 'dashboard', label: 'Stats', icon: BarChart3 },
];

export function GlassDock({ currentTab, onTabChange, onAdd }: GlassDockProps) {
  // Split tabs into left (before FAB) and right (after FAB)
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const renderTab = (tab: typeof tabs[0]) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;

    return (
      <motion.button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <span className="text-2xs font-medium truncate max-w-[56px]">{tab.label}</span>

        {isActive && (
          <motion.div
            layoutId="dock-indicator"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))',
              boxShadow: '0 0 10px hsl(var(--neon-purple) / 0.6)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-dock safe-area-pb">
      <div className="container flex items-center justify-around py-2 max-w-md mx-auto">
        {leftTabs.map(renderTab)}

        {/* Add Button - Floating with Glow */}
        <motion.button
          onClick={onAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="relative -mt-6"
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
                '0 0 30px hsl(var(--primary) / 0.6), 0 0 60px hsl(var(--primary) / 0.3)',
                '0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
