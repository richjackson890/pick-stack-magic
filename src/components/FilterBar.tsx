import { useState } from 'react';
import { Platform, PLATFORMS } from '@/types/pickstack';
import { DbCategory } from '@/hooks/useDbCategories';
import { CategoryChip } from '@/components/CategoryBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, SlidersHorizontal, Grid3X3, List, LayoutGrid, Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  categories: DbCategory[];
  selectedCategoryId: string | null;
  selectedPlatform: Platform | null;
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'masonry';
  onCategoryChange: (categoryId: string | null) => void;
  onPlatformChange: (platform: Platform | null) => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'masonry') => void;
  onAddCategory?: () => void;
}

export function FilterBar({ categories, selectedCategoryId, selectedPlatform, searchQuery, viewMode, onCategoryChange, onPlatformChange, onSearchChange, onViewModeChange, onAddCategory }: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="sticky top-12 z-20 bg-background/95 backdrop-blur border-b">
      <div className="container px-2 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn('flex-1 flex items-center gap-2 bg-secondary/60 rounded-lg px-2.5 py-1.5 transition-all', isSearchFocused && 'ring-2 ring-primary/30')}>
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} className="border-0 bg-transparent h-6 px-0 text-sm focus-visible:ring-0" />
          </div>
          
          <Popover>
            <PopoverTrigger asChild><Button variant={selectedPlatform ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8">{selectedPlatform ? <PlatformIcon platform={selectedPlatform} size="sm" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}</Button></PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">플랫폼 필터</p>
              <div className="flex flex-wrap gap-1.5">
                <Button variant={selectedPlatform === null ? 'default' : 'outline'} size="sm" onClick={() => onPlatformChange(null)} className="h-7 text-xs">전체</Button>
                {PLATFORMS.filter(p => p !== 'Unknown').map((platform) => (
                  <button key={platform} onClick={() => onPlatformChange(platform)} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all', selectedPlatform === platform ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>
                    <PlatformIcon platform={platform} size="sm" />{platform}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center bg-secondary/60 rounded-lg p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('grid')} className="h-7 w-7"><Grid3X3 className="h-3.5 w-3.5" /></Button>
            <Button variant={viewMode === 'masonry' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('masonry')} className="h-7 w-7"><LayoutGrid className="h-3.5 w-3.5" /></Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('list')} className="h-7 w-7"><List className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => onCategoryChange(null)} className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap', selectedCategoryId === null ? 'bg-foreground text-background' : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary')}>전체</button>
          {sortedCategories.map((category) => <CategoryChip key={category.id} category={category} selected={selectedCategoryId === category.id} onClick={() => onCategoryChange(category.id)} />)}
          {onAddCategory && <button onClick={onAddCategory} className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground"><Plus className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
    </div>
  );
}
