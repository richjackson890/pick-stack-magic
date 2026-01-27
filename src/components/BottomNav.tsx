import { Home, Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentTab: 'home' | 'health';
  onTabChange: (tab: 'home' | 'health') => void;
  onAdd: () => void;
}

export function BottomNav({ currentTab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="container flex items-center justify-around py-1.5">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={cn(
            'flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-lg transition-colors',
            currentTab === 'home' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Home className="h-4 w-4" />
          <span className="text-[10px] font-medium">홈</span>
        </button>

        {/* Add Button - Compact */}
        <button
          onClick={onAdd}
          className="relative -mt-5 w-12 h-12 rounded-full gradient-primary shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5 text-white" />
        </button>

        {/* Health Report */}
        <button
          onClick={() => onTabChange('health')}
          className={cn(
            'flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-lg transition-colors',
            currentTab === 'health' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Activity className="h-4 w-4" />
          <span className="text-[10px] font-medium">건강</span>
        </button>
      </div>
    </nav>
  );
}
