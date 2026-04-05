import { motion } from 'framer-motion';
import { Home, Plus, Sparkles, BarChart3, Users, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuideTooltip, isTooltipSeen } from '@/components/GuideTooltip';

type TabType = 'home' | 'creator' | 'calendar' | 'report' | 'dashboard';

interface GlassDockProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAdd: () => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Tips', icon: Home },
  { id: 'creator', label: 'Team', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'report', label: 'AI Report', icon: Sparkles },
  { id: 'dashboard', label: 'Stats', icon: BarChart3 },
];

export function GlassDock({ currentTab, onTabChange, onAdd }: GlassDockProps) {
  // Split tabs into left (before FAB) and right (after FAB)
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 5);

  const renderTab = (tab: typeof tabs[0]) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;

    const button = (
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

    const tooltipMap: Record<string, { name: string; message: string }> = {
      calendar: { name: 'calendar', message: '팀 일정과 개인 휴가를 한눈에 관리할 수 있어요. 프로젝트 마감일도 확인 가능해요' },
      report: { name: 'ai_report', message: 'AI가 팀의 팁 활동을 분석해서 주간 리포트를 자동으로 만들어드려요' },
      dashboard: { name: 'stats', message: '팀원별 팁 기여도와 카테고리별 통계를 확인할 수 있어요' },
    };

    const tooltip = tooltipMap[tab.id];
    if (tooltip) {
      return (
        <GuideTooltip key={tab.id} name={tooltip.name} message={tooltip.message}>
          {button}
        </GuideTooltip>
      );
    }

    return button;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-dock safe-area-pb">
      <div className="container flex items-center justify-around py-2 max-w-md mx-auto">
        {leftTabs.map(renderTab)}

        {/* Add Button - Floating with Glow */}
        <GuideTooltip name="fab_add" message="새 팁을 등록하세요! URL을 붙여넣거나 이미지를 첨부하면 AI가 자동으로 분석해드려요">
          <motion.button
            onClick={onAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="relative -mt-6"
          >
            {/* Pulsing ping + bouncing label for first-time users */}
            {!isTooltipSeen('fab_add') && (
              <>
                <span className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                  <span className="absolute w-14 h-14 rounded-full animate-ping bg-orange-400/50" />
                </span>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center animate-bounce">
                  <span className="whitespace-nowrap text-[11px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full shadow-sm">팁 등록</span>
                  <span className="text-orange-400 text-base leading-none">▼</span>
                </span>
              </>
            )}
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
        </GuideTooltip>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
