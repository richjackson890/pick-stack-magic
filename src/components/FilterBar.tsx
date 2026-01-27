import { Search, Grid3X3, List, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { Category, Platform, CATEGORIES, PLATFORMS } from '@/types/pickstack';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface FilterBarProps {
  selectedCategory: Category | null;
  selectedPlatform: Platform | null;
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'masonry';
  onCategoryChange: (category: Category | null) => void;
  onPlatformChange: (platform: Platform | null) => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'masonry') => void;
  onHealthSummary?: () => void;
}

export function FilterBar({
  selectedCategory,
  selectedPlatform,
  searchQuery,
  viewMode,
  onCategoryChange,
  onPlatformChange,
  onSearchChange,
  onViewModeChange,
  onHealthSummary,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container py-2 space-y-2">
        {/* Search + Actions Row */}
        <div className="flex items-center gap-2">
          {/* Search Input - Compact */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 shrink-0",
                  selectedPlatform && "text-primary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuLabel className="text-xs">플랫폼 필터</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onPlatformChange(null)}
                className={cn(!selectedPlatform && "bg-accent")}
              >
                전체 플랫폼
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PLATFORMS.slice(0, 8).map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => onPlatformChange(platform)}
                  className={cn(selectedPlatform === platform && "bg-accent")}
                >
                  {platform}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/50 rounded-md p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "h-7 w-7",
                viewMode === 'grid' && "bg-background shadow-sm"
              )}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange('masonry')}
              className={cn(
                "h-7 w-7",
                viewMode === 'masonry' && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "h-7 w-7",
                viewMode === 'list' && "bg-background shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Category Chips Row - Compact */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            전체
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {category}
            </button>
          ))}
          
          {/* Health Summary Button - Only shown when health filter is active */}
          {selectedCategory === '건강' && onHealthSummary && (
            <button
              onClick={onHealthSummary}
              className="shrink-0 ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground hover:opacity-90 transition-all"
            >
              종합요약
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
