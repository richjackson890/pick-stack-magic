import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform, PLATFORMS } from '@/types/pickstack';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { GlassChip, GlassChipGroup } from '@/components/GlassChip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, SlidersHorizontal, Grid3X3, List, LayoutGrid, Plus, X } from 'lucide-react';
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

export function FilterBar({ 
  categories, 
  selectedCategoryId, 
  selectedPlatform, 
  searchQuery, 
  viewMode, 
  onCategoryChange, 
  onPlatformChange, 
  onSearchChange, 
  onViewModeChange, 
  onAddCategory 
}: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="sticky top-12 z-20 glass-dock border-t-0 border-b border-border/30">
      <div className="container px-3 py-2.5 space-y-2.5">
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <motion.div 
            className={cn(
              'flex-1 flex items-center gap-2 glass-chip px-3 py-2 transition-all',
              isSearchFocused && 'ring-1 ring-primary/40 neon-glow'
            )}
            animate={{
              boxShadow: isSearchFocused 
                ? '0 0 20px hsl(var(--neon-purple) / 0.2)' 
                : 'none'
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSearchChange('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Platform Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'glass-button w-9 h-9 flex items-center justify-center',
                  selectedPlatform && 'ring-1 ring-primary/50'
                )}
              >
                {selectedPlatform ? (
                  <PlatformIcon platform={selectedPlatform} size="sm" />
                ) : (
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 glass-sheet border-border/30" align="end">
              <p className="text-xs font-semibold text-muted-foreground mb-3">플랫폼 필터</p>
              <div className="flex flex-wrap gap-2">
                <GlassChip
                  selected={selectedPlatform === null}
                  onClick={() => onPlatformChange(null)}
                  size="sm"
                >
                  전체
                </GlassChip>
                {PLATFORMS.filter(p => p !== 'Unknown').map((platform) => (
                  <GlassChip
                    key={platform}
                    selected={selectedPlatform === platform}
                    onClick={() => onPlatformChange(platform)}
                    size="sm"
                    icon={<PlatformIcon platform={platform} size="sm" className="w-4 h-4" />}
                  >
                    {platform}
                  </GlassChip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* View Mode Toggle */}
          <div className="flex items-center glass-chip p-1 gap-0.5">
            {[
              { mode: 'grid' as const, icon: Grid3X3 },
              { mode: 'masonry' as const, icon: LayoutGrid },
              { mode: 'list' as const, icon: List },
            ].map(({ mode, icon: Icon }) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  viewMode === mode 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Category Chips */}
        <GlassChipGroup>
          <GlassChip
            selected={selectedCategoryId === null}
            onClick={() => onCategoryChange(null)}
          >
            전체
          </GlassChip>
          
          {sortedCategories.map((category) => (
            <GlassChip
              key={category.id}
              selected={selectedCategoryId === category.id}
              onClick={() => onCategoryChange(category.id)}
              color={category.color}
              icon={category.icon ? <span>{category.icon}</span> : undefined}
            >
              {category.name}
            </GlassChip>
          ))}
          
          {onAddCategory && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddCategory}
              className="glass-chip w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          )}
        </GlassChipGroup>
      </div>
    </div>
  );
}
