import { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search, Star, Clock, X } from 'lucide-react';
import { 
  IconCategory, 
  ICON_CATEGORY_LABELS, 
  ICON_REGISTRY,
  searchIcons, 
  getIconComponent,
  IconItem,
} from '@/lib/iconRegistry';
import { useIsMobile } from '@/hooks/use-mobile';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color?: string;
  trigger?: React.ReactNode;
}

const STORAGE_KEY_RECENT = 'pickstack_recent_icons';
const STORAGE_KEY_FAVORITES = 'pickstack_favorite_icons';
const MAX_RECENT = 12;

function getRecentIcons(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECENT);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentIcon(key: string) {
  const recent = getRecentIcons().filter(k => k !== key);
  recent.unshift(key);
  localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function getFavoriteIcons(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function toggleFavoriteIcon(key: string): boolean {
  const favorites = getFavoriteIcons();
  const index = favorites.indexOf(key);
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    return false;
  } else {
    favorites.unshift(key);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    return true;
  }
}

// Icon display component
function IconDisplay({ iconKey, size = 'md', className }: { iconKey: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const iconData = getIconComponent(iconKey);
  
  const sizeClasses = {
    sm: 'text-sm w-4 h-4',
    md: 'text-lg w-5 h-5',
    lg: 'text-xl w-6 h-6',
  };
  
  if (iconData.type === 'lucide' && iconData.component) {
    const IconComponent = iconData.component;
    return <IconComponent className={cn(sizeClasses[size], className)} />;
  }
  
  return <span className={cn(sizeClasses[size], 'flex items-center justify-center', className)}>{iconData.value}</span>;
}

// Category tabs with horizontal scroll
const CATEGORY_ORDER: IconCategory[] = ['all', 'recommended', 'health', 'food', 'money', 'study', 'travel', 'work', 'hobby', 'brand'];

export function IconPicker({ value, onChange, color = '#6b7280', trigger }: IconPickerProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconCategory>('all');
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [favoriteIcons, setFavoriteIcons] = useState<string[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Load recent and favorites on mount
  useEffect(() => {
    setRecentIcons(getRecentIcons());
    setFavoriteIcons(getFavoriteIcons());
  }, [isOpen]);
  
  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    return searchIcons(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);
  
  // Get icons for recent section
  const recentIconItems = useMemo(() => {
    return recentIcons
      .map(key => ICON_REGISTRY.find(item => item.key === key))
      .filter((item): item is IconItem => !!item);
  }, [recentIcons]);
  
  // Get icons for favorites section
  const favoriteIconItems = useMemo(() => {
    return favoriteIcons
      .map(key => ICON_REGISTRY.find(item => item.key === key))
      .filter((item): item is IconItem => !!item);
  }, [favoriteIcons]);
  
  const handleSelect = useCallback((key: string) => {
    onChange(key);
    addRecentIcon(key);
    setRecentIcons(getRecentIcons());
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);
  
  const handleFavoriteToggle = useCallback((key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteIcon(key);
    setFavoriteIcons(getFavoriteIcons());
  }, []);
  
  // Long press for mobile favorites
  const handleLongPressStart = useCallback((key: string) => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      toggleFavoriteIcon(key);
      setFavoriteIcons(getFavoriteIcons());
    }, 500);
    setLongPressTimer(timer);
  }, [isMobile]);
  
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);
  
  // Icon grid item
  const renderIconItem = (item: IconItem, showFavorite = true) => {
    const isFavorite = favoriteIcons.includes(item.key);
    const isSelected = value === item.key;
    
    return (
      <button
        key={item.key}
        onClick={() => handleSelect(item.key)}
        onMouseDown={() => handleLongPressStart(item.key)}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={() => handleLongPressStart(item.key)}
        onTouchEnd={handleLongPressEnd}
        className={cn(
          'relative w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-150',
          'hover:scale-110 hover:bg-primary/10 active:scale-95',
          isSelected && 'bg-primary/20 ring-2 ring-primary'
        )}
        title={item.name}
      >
        <IconDisplay iconKey={item.key} size="md" />
        {showFavorite && !isMobile && (
          <button
            onClick={(e) => handleFavoriteToggle(item.key, e)}
            className={cn(
              'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-opacity',
              'opacity-0 group-hover:opacity-100 hover:opacity-100',
              isFavorite ? 'bg-yellow-400 text-yellow-900' : 'bg-muted text-muted-foreground hover:bg-yellow-400 hover:text-yellow-900'
            )}
          >
            <Star className="w-2.5 h-2.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </button>
    );
  };
  
  const triggerButton = trigger || (
    <button
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all',
        'ring-2 ring-border hover:ring-primary/50 hover:scale-105',
        'bg-background shadow-sm'
      )}
      style={{ backgroundColor: `${color}20` }}
    >
      <IconDisplay iconKey={value} size="lg" />
    </button>
  );
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[340px] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl" 
        align="start"
        sideOffset={8}
      >
        <div className="p-3 space-y-3">
          {/* Header with preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner"
                style={{ backgroundColor: color }}
              >
                <IconDisplay iconKey={value} size="lg" className="text-white drop-shadow-sm" />
              </div>
              <div>
                <p className="text-sm font-medium">아이콘 선택</p>
                <p className="text-xs text-muted-foreground">검색하거나 탭에서 선택</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이콘 검색 (예: 운동, health)"
              className="pl-9 h-9 text-sm bg-muted/50"
            />
          </div>
          
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as IconCategory)}>
            <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
              <TabsList className="inline-flex h-8 bg-muted/50 p-0.5 gap-0.5 w-max">
                {CATEGORY_ORDER.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="px-2.5 h-7 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {ICON_CATEGORY_LABELS[cat]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
        
        <ScrollArea className="h-[280px]">
          <div className="px-3 pb-3 space-y-4">
            {/* Favorites Section */}
            {favoriteIconItems.length > 0 && !searchQuery && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                  <span className="text-xs font-medium text-muted-foreground">즐겨찾기</span>
                </div>
                <div className="grid grid-cols-8 gap-1 group">
                  {favoriteIconItems.map(item => renderIconItem(item, false))}
                </div>
              </div>
            )}
            
            {/* Recent Section */}
            {recentIconItems.length > 0 && !searchQuery && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">최근 사용</span>
                </div>
                <div className="grid grid-cols-8 gap-1 group">
                  {recentIconItems.map(item => renderIconItem(item))}
                </div>
              </div>
            )}
            
            {/* Main Icon Grid */}
            <div>
              {(recentIconItems.length > 0 || favoriteIconItems.length > 0) && !searchQuery && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {searchQuery ? '검색 결과' : ICON_CATEGORY_LABELS[activeCategory]}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    ({filteredIcons.length})
                  </span>
                </div>
              )}
              <div className="grid grid-cols-8 gap-1 group">
                {filteredIcons.map(item => renderIconItem(item))}
              </div>
              
              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                  <p className="text-xs mt-1">다른 키워드로 검색해보세요</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer hint */}
        <div className="px-3 py-2 border-t bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground">
            {isMobile ? '길게 눌러 즐겨찾기 추가' : '마우스를 올려 즐겨찾기 추가'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export IconDisplay for use in other components
export { IconDisplay };
