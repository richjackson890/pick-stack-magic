import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform, PLATFORMS } from '@/types/pickstack';
import { DbCategory } from '@/hooks/useDbCategories';
import { DbItem } from '@/hooks/useDbItems';
import { PlatformIcon } from '@/components/PlatformIcon';
import { GlassChip, GlassChipGroup } from '@/components/GlassChip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconDisplay } from '@/components/IconPicker';
import { migrateIconKey } from '@/lib/iconRegistry';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  LayoutGrid, 
  Plus, 
  X, 
  Clock, 
  Hash, 
  TrendingUp,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedFilterBarProps {
  categories: DbCategory[];
  items: DbItem[];
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

// Storage keys for search history
const SEARCH_HISTORY_KEY = 'pickstack_search_history';
const MAX_SEARCH_HISTORY = 10;

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addSearchHistory(query: string) {
  if (!query.trim()) return;
  const history = getSearchHistory().filter(q => q !== query);
  history.unshift(query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)));
}

export function EnhancedFilterBar({ 
  categories, 
  items,
  selectedCategoryId, 
  selectedPlatform, 
  searchQuery, 
  viewMode, 
  onCategoryChange, 
  onPlatformChange, 
  onSearchChange, 
  onViewModeChange, 
  onAddCategory 
}: EnhancedFilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  // Load search history on focus
  useEffect(() => {
    if (isSearchFocused) {
      setSearchHistory(getSearchHistory());
      setShowSuggestions(true);
    }
  }, [isSearchFocused]);

  // Extract frequent keywords from items for suggestions
  const keywordSuggestions = useMemo(() => {
    const keywordCount = new Map<string, number>();
    
    items.forEach(item => {
      // Count tags
      item.tags?.forEach(tag => {
        keywordCount.set(tag, (keywordCount.get(tag) || 0) + 1);
      });
      // Count core_keywords if available
      (item as any).core_keywords?.forEach((kw: string) => {
        keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
      });
      // Count hashtags if available
      (item as any).hashtags?.forEach((ht: string) => {
        keywordCount.set(ht.replace(/^#/, ''), (keywordCount.get(ht.replace(/^#/, '')) || 0) + 1);
      });
    });
    
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword]) => keyword);
  }, [items]);

  // Filter suggestions based on current query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    return keywordSuggestions
      .filter(kw => kw.toLowerCase().includes(query) && kw.toLowerCase() !== query)
      .slice(0, 5);
  }, [searchQuery, keywordSuggestions]);

  // Platform suggestions based on items
  const platformSuggestions = useMemo(() => {
    const platformCount = new Map<Platform, number>();
    items.forEach(item => {
      const platform = item.platform as Platform;
      platformCount.set(platform, (platformCount.get(platform) || 0) + 1);
    });
    return Array.from(platformCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([platform]) => platform);
  }, [items]);

  const handleSearchSubmit = useCallback((query: string) => {
    if (query.trim()) {
      addSearchHistory(query);
      onSearchChange(query);
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  }, [onSearchChange]);

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    addSearchHistory(suggestion);
    setShowSuggestions(false);
  };

  const clearHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  };

  return (
    <div className="sticky top-12 z-20 glass-dock border-t-0 border-b border-border/30">
      <div className="container px-3 py-2.5 space-y-2.5">
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <motion.div 
              className={cn(
                'flex items-center gap-2 glass-chip px-3 py-2 transition-all',
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
                ref={searchInputRef}
                type="text"
                placeholder="제목, 키워드, 해시태그로 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delay to allow click on suggestions
                  setTimeout(() => {
                    setIsSearchFocused(false);
                    setShowSuggestions(false);
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchQuery);
                  }
                }}
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

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 glass-sheet rounded-xl border border-border/40 shadow-xl overflow-hidden z-50"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Recent Searches */}
                    {searchHistory.length > 0 && !searchQuery && (
                      <div className="p-2 border-b border-border/30">
                        <div className="flex items-center justify-between px-2 mb-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            최근 검색
                          </span>
                          <button
                            onClick={clearHistory}
                            className="text-[10px] text-muted-foreground hover:text-destructive"
                          >
                            지우기
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchHistory.slice(0, 5).map((query, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(query)}
                              className="glass-chip px-2.5 py-1 text-xs hover:bg-primary/10"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtered Suggestions */}
                    {filteredSuggestions.length > 0 && (
                      <div className="p-2 border-b border-border/30">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 px-2 mb-1.5">
                          <TrendingUp className="h-3 w-3" />
                          추천 키워드
                        </span>
                        <div className="space-y-0.5">
                          {filteredSuggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-primary/10 rounded-lg flex items-center gap-2"
                            >
                              <Search className="h-3 w-3 text-muted-foreground" />
                              <span 
                                dangerouslySetInnerHTML={{
                                  __html: highlightMatch(suggestion, searchQuery)
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword Chips */}
                    {!searchQuery && keywordSuggestions.length > 0 && (
                      <div className="p-2 border-b border-border/30">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 px-2 mb-1.5">
                          <Hash className="h-3 w-3" />
                          인기 키워드
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordSuggestions.map((keyword, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(keyword)}
                              className="glass-chip px-2.5 py-1 text-xs hover:bg-primary/10"
                            >
                              #{keyword}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category Suggestions */}
                    {!searchQuery && (
                      <div className="p-2">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 px-2 mb-1.5">
                          <Filter className="h-3 w-3" />
                          카테고리로 찾기
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sortedCategories.slice(0, 6).map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                onCategoryChange(cat.id);
                                setShowSuggestions(false);
                              }}
                              className="glass-chip px-2.5 py-1 text-xs hover:bg-primary/10 flex items-center gap-1"
                            >
                              <IconDisplay iconKey={migrateIconKey(cat.icon)} size="sm" />
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
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
                {platformSuggestions.length > 0 && (
                  <>
                    {platformSuggestions.map((platform) => (
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
                  </>
                )}
                <details className="w-full">
                  <summary className="text-xs text-muted-foreground cursor-pointer mt-2 flex items-center gap-1">
                    <ChevronDown className="h-3 w-3" />
                    모든 플랫폼 보기
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PLATFORMS.filter(p => p !== 'Unknown' && !platformSuggestions.includes(p)).map((platform) => (
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
                </details>
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
              icon={<IconDisplay iconKey={migrateIconKey(category.icon)} size="sm" />}
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

        {/* Active Filters Display */}
        {(selectedCategoryId || selectedPlatform || searchQuery) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">필터:</span>
            <div className="flex flex-wrap gap-1">
              {searchQuery && (
                <span className="glass-chip px-2 py-0.5 flex items-center gap-1">
                  "{searchQuery}"
                  <button onClick={() => onSearchChange('')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategoryId && (
                <span 
                  className="px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                  style={{ backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color }}
                >
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                  <button onClick={() => onCategoryChange(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedPlatform && (
                <span className="glass-chip px-2 py-0.5 flex items-center gap-1">
                  <PlatformIcon platform={selectedPlatform} size="xs" />
                  {selectedPlatform}
                  <button onClick={() => onPlatformChange(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<strong class="text-primary">$1</strong>');
}
