import { motion } from 'framer-motion';
import { Settings, LogOut, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UsageBadge } from '@/components/UsageBadge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TipButton } from '@/components/TipButton';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { usageData } = useUsageLimits();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: '로그아웃 되었습니다',
    });
  };

  return (
    <header className="sticky top-0 z-40 glass-dock border-b-0">
      <div className="container flex items-center justify-between h-12 px-3">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center neon-glow-orange"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className="w-4 h-4 text-white" />
          </motion.div>
          <h1 className="text-lg font-bold">
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Pick
            </span>
            <span className="bg-gradient-to-r from-primary to-neon-pink bg-clip-text text-transparent">
              Stack
            </span>
          </h1>
        </motion.div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Usage Badge */}
          <UsageBadge
            itemsCount={usageData.itemsCount}
            aiAnalysisCount={usageData.aiAnalysisCount}
            isPremium={usageData.isPremium}
            compact
          />
          
          {onSettingsClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsClick}
              className="glass-button w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="glass-button w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
