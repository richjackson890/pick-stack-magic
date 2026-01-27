import { useState } from 'react';
import { Category, Platform, CATEGORIES, PLATFORMS } from '@/types/pickstack';
import { CategoryTag } from './CategoryTag';
import { Search, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface FilterBarProps {
  selectedCategory: Category | null;
  selectedPlatform: Platform | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  onCategoryChange: (category: Category | null) => void;
  onPlatformChange: (platform: Platform | null) => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
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
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container py-3 space-y-3">
        {/* Search and Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-secondary border-0"
            />
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Category Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-3">카테고리</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <CategoryTag
                        key={cat}
                        category={cat}
                        size="md"
                        selected={selectedCategory === cat}
                        onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
                      />
                    ))}
                  </div>
                </div>

                {/* Platform Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-3">플랫폼</h4>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.slice(0, 10).map((plat) => (
                      <button
                        key={plat}
                        onClick={() => onPlatformChange(selectedPlatform === plat ? null : plat)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full transition-all',
                          selectedPlatform === plat
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-muted'
                        )}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || selectedPlatform) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">활성 필터:</span>
            {selectedCategory && (
              <button
                onClick={() => onCategoryChange(null)}
                className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full"
              >
                {selectedCategory}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedPlatform && (
              <button
                onClick={() => onPlatformChange(null)}
                className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full"
              >
                {selectedPlatform}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Quick Category Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all',
              !selectedCategory
                ? 'gradient-primary text-white'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <CategoryTag
              key={cat}
              category={cat}
              size="md"
              selected={selectedCategory === cat}
              onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
