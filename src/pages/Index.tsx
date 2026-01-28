import { useState, useMemo } from 'react';
import { Platform } from '@/types/pickstack';
import { useAuth } from '@/contexts/AuthContext';
import { useDbCategories } from '@/hooks/useDbCategories';
import { useDbItems, DbItem } from '@/hooks/useDbItems';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useBatchAnalyze } from '@/hooks/useBatchAnalyze';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { SavedItemCard } from '@/components/SavedItemCard';
import { ListViewItem } from '@/components/ListViewItem';
import { ItemDetail } from '@/components/ItemDetail';
import { SaveModal } from '@/components/SaveModal';
import { BottomNav } from '@/components/BottomNav';
import { HealthReport } from '@/components/HealthReport';
import { CategoryManagement } from '@/components/CategoryManagement';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Zap, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories, loading: categoriesLoading, getCategoryById, getDefaultCategory, addCategory, updateCategory, deleteCategory, reorderCategories } = useDbCategories();
  const { items, loading: itemsLoading, addItem, updateItem, deleteItem, refetch } = useDbItems();
  const { settings, updateAutoAnalyze } = useUserSettings();
  const { analyzePending, isProcessing, progress } = useBatchAnalyze();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid');
  const [selectedItem, setSelectedItem] = useState<DbItem | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'health'>('home');

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategoryId && item.category_id !== selectedCategoryId) return false;
      if (selectedPlatform && item.platform !== selectedPlatform) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.summary_3lines.some((line) => line.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [items, selectedCategoryId, selectedPlatform, searchQuery]);

  // Count pending items for batch analyze
  const pendingItems = useMemo(() => items.filter(i => i.ai_status === 'pending'), [items]);

  // Check if health category is selected
  const healthCategory = categories.find((c) => c.name === '건강');
  const isHealthSelected = selectedCategoryId === healthCategory?.id;

  // Handle batch analyze
  const handleBatchAnalyze = async () => {
    const ids = pendingItems.map(i => i.id);
    await analyzePending(ids);
    refetch();
  };

  const handleSave = async (newItem: {
    source_type: 'url' | 'text' | 'image';
    url?: string;
    title: string;
    platform: Platform;
    thumbnail_url?: string;
    summary_3lines: string[];
    tags: string[];
    category_id: string;
    user_note?: string;
    ai_confidence?: number;
    ai_reason?: string;
  }) => {
    const savedItem = await addItem({
      source_type: newItem.source_type,
      url: newItem.url || null,
      title: newItem.title,
      platform: newItem.platform,
      thumbnail_url: newItem.thumbnail_url || null,
      summary_3lines: newItem.summary_3lines,
      tags: newItem.tags,
      category_id: newItem.category_id,
      user_note: newItem.user_note || null,
      ai_confidence: newItem.ai_confidence || null,
      ai_reason: newItem.ai_reason || null,
      ai_status: 'pending',
      ai_error: null,
      ai_started_at: null,
      ai_finished_at: null,
      ai_attempts: 0,
      extracted_text: null,
      url_hash: null,
      analysis_mode: 'light',
    } as any);
    
    // Trigger content analysis in background
    if (savedItem?.id) {
      triggerAnalysis(savedItem.id);
    }
  };
  
  // Trigger analysis via edge function (respects auto_analyze setting)
  const triggerAnalysis = async (itemId: string) => {
    if (!settings.auto_analyze) {
      console.log('[Index] Auto-analyze disabled, skipping');
      return;
    }
    try {
      console.log('[Index] Triggering analysis for:', itemId);
      const { error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: itemId, mode: 'light' },
      });
      if (error) {
        console.error('[Index] Analysis trigger error:', error);
      } else {
        setTimeout(() => refetch(), 2000);
      }
    } catch (e) {
      console.error('[Index] Analysis trigger failed:', e);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<DbItem>) => {
    await updateItem(id, updates);
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleHealthSummary = () => {
    setCurrentTab('health');
  };

  // Loading state
  if (categoriesLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (currentTab === 'health') {
    return (
      <>
        <HealthReport onClose={() => setCurrentTab('home')} />
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onAdd={() => setIsSaveModalOpen(true)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onSettingsClick={() => setIsCategoryManagementOpen(true)} />
      
      <FilterBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedPlatform={selectedPlatform}
        searchQuery={searchQuery}
        viewMode={viewMode}
        onCategoryChange={setSelectedCategoryId}
        onPlatformChange={setSelectedPlatform}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onHealthSummary={isHealthSelected ? handleHealthSummary : undefined}
        onAddCategory={() => setIsCategoryManagementOpen(true)}
      />

      <main className="container py-3 px-2">
        {items.length === 0 ? (
          <EmptyState onAddClick={() => setIsSaveModalOpen(true)} />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <ListViewItem
                  item={item}
                  category={getCategoryById(item.category_id || '')}
                  onClick={() => setSelectedItem(item)}
                />
              </div>
            ))}
          </div>
        ) : viewMode === 'masonry' ? (
          <div className="masonry-grid">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <SavedItemCard
                  item={item}
                  category={getCategoryById(item.category_id || '')}
                  onClick={() => setSelectedItem(item)}
                  isMasonry={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="compact-grid">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <SavedItemCard
                  item={item}
                  category={getCategoryById(item.category_id || '')}
                  onClick={() => setSelectedItem(item)}
                  isMasonry={false}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onAdd={() => setIsSaveModalOpen(true)}
      />

      <ItemDetail
        item={selectedItem}
        categories={categories}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdateItem}
        onDelete={deleteItem}
        onRefetch={refetch}
      />

      <SaveModal
        isOpen={isSaveModalOpen}
        categories={categories}
        getDefaultCategory={getDefaultCategory}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />

      <CategoryManagement
        isOpen={isCategoryManagementOpen}
        categories={categories}
        onClose={() => setIsCategoryManagementOpen(false)}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        onReorder={reorderCategories}
      />
    </div>
  );
};

export default Index;
