import { Home, Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentTab: 'home' | 'health';
  onTabChange: (tab: 'home' | 'health') => void;
  onAdd: () => void;
}

export function BottomNav({ currentTab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="container flex items-center justify-around py-2">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={cn(
            'flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors',
            currentTab === 'home' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">홈</span>
        </button>

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="relative -mt-6 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>

        {/* Health Report */}
        <button
          onClick={() => onTabChange('health')}
          className={cn(
            'flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors',
            currentTab === 'health' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Activity className="h-5 w-5" />
          <span className="text-xs font-medium">건강</span>
        </button>
      </div>
    </nav>
  );
}
