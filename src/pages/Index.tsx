import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Platform } from '@/types/pickstack';
import { useAuth } from '@/contexts/AuthContext';
import { useDbCategories } from '@/hooks/useDbCategories';
import { useDbItems, DbItem } from '@/hooks/useDbItems';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useBatchAnalyze } from '@/hooks/useBatchAnalyze';
import { useContentAnalysis } from '@/hooks/useContentAnalysis';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Header } from '@/components/Header';
import { EnhancedFilterBar } from '@/components/EnhancedFilterBar';
import { GlassCard } from '@/components/GlassCard';
import { TextThumbnailCard } from '@/components/TextThumbnailCard';
import { ItemDetail } from '@/components/ItemDetail';
import { SaveModal } from '@/components/SaveModal';
import { GlassDock } from '@/components/GlassDock';
import { AIReport } from '@/components/AIReport';
import { CategoryManagement } from '@/components/CategoryManagement';
import { EmptyState } from '@/components/EmptyState';
import { LiquidSpinner } from '@/components/LiquidSpinner';
import { GlassToast } from '@/components/GlassToast';
import { ShareCollectionModal } from '@/components/ShareCollectionModal';
import { AdBanner } from '@/components/AdBanner';
import { UpgradeModal } from '@/components/UpgradeModal';
import { RefreshCw, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { categories, loading: categoriesLoading, getCategoryById, getDefaultCategory, addCategory, updateCategory, deleteCategory, reorderCategories } = useDbCategories();
  const { items, loading: itemsLoading, addItem, updateItem, deleteItem, refetch } = useDbItems();
  const { settings, updateAutoAnalyze } = useUserSettings();
  const { analyzePending, isProcessing, progress } = useBatchAnalyze();
  const { triggerAutoAnalysis } = useContentAnalysis();
  const { canSaveItem, canUseAiAnalysis, usageData, refetch: refetchUsage } = useUsageLimits();
  
  // Back navigation hook for PWA
  useBackNavigation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid');
  const [selectedItem, setSelectedItem] = useState<DbItem | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'report'>('home');
  const [isShareCollectionOpen, setIsShareCollectionOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'items' | 'ai' | 'general'>('general');
  
  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Toast state
  const [toastState, setToastState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'loading' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Enhanced filter with search_blob
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategoryId && item.category_id !== selectedCategoryId) return false;
      if (selectedPlatform && item.platform !== selectedPlatform) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        // Search in multiple fields for better discovery
        const searchBlob = (item as any).search_blob?.toLowerCase() || '';
        const titleMatch = item.title?.toLowerCase().includes(query);
        const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(query));
        const summaryMatch = item.summary_3lines?.some((line) => line?.toLowerCase().includes(query));
        const keywordMatch = (item as any).core_keywords?.some((kw: string) => kw?.toLowerCase().includes(query));
        const hashtagMatch = (item as any).hashtags?.some((ht: string) => ht?.toLowerCase().includes(query));
        const entityMatch = (item as any).entities?.some((e: string) => e?.toLowerCase().includes(query));
        const blobMatch = searchBlob.includes(query);
        
        return titleMatch || tagMatch || summaryMatch || keywordMatch || hashtagMatch || entityMatch || blobMatch;
      }
      return true;
    });
  }, [items, selectedCategoryId, selectedPlatform, searchQuery]);

  // Count pending items for batch analyze
  const pendingItems = useMemo(() => items.filter(i => i.ai_status === 'pending' || i.ai_status === 'error'), [items]);

  // Handle batch analyze
  const handleBatchAnalyze = async () => {
    const ids = pendingItems.map(i => i.id);
    await analyzePending(ids);
    refetch();
  };

  // Handle single retry
  const handleRetryAnalysis = async (itemId: string) => {
    await triggerAutoAnalysis(itemId);
    setTimeout(() => refetch(), 1500);
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      setToastState({ show: true, type: 'success', message: '업데이트 완료' });
      setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 2000);
    }, 800);
  }, [refetch]);

  // Handle add button click with limit check
  const handleAddClick = useCallback(() => {
    if (!canSaveItem) {
      setUpgradeReason('items');
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsSaveModalOpen(true);
  }, [canSaveItem]);

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
    
    // Refresh usage after save
    refetchUsage();
    
    // Trigger content analysis in background if auto_analyze is enabled and has quota
    if (savedItem?.id && settings.auto_analyze && canUseAiAnalysis) {
      triggerAutoAnalysis(savedItem.id).then(() => {
        setTimeout(() => {
          refetch();
          refetchUsage();
        }, 1500);
      });
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<DbItem>) => {
    await updateItem(id, updates);
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem(itemId);
    setToastState({ show: true, type: 'success', message: '삭제되었습니다' });
    setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 2000);
  };

  // Loading state
  if (categoriesLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LiquidSpinner size="lg" />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            로딩 중...
          </motion.p>
        </div>
      </div>
    );
  }

  if (currentTab === 'report') {
    return (
      <>
        <AIReport 
          items={items}
          categories={categories}
          onClose={() => setCurrentTab('home')}
          onRetryAnalysis={handleRetryAnalysis}
          onBatchAnalyze={handleBatchAnalyze}
          isProcessing={isProcessing}
        />
        <GlassDock
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onAdd={handleAddClick}
        />
      </>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen pb-24">
      <Header onSettingsClick={() => setIsCategoryManagementOpen(true)} />

      {/* Top Ad Banner - Only for non-premium users */}
      {!usageData.isPremium && (
        <div className="container px-2 pt-2">
          <AdBanner slot="top" isPremium={usageData.isPremium} />
        </div>
      )}
      
      <EnhancedFilterBar
        categories={categories}
        items={items}
        selectedCategoryId={selectedCategoryId}
        selectedPlatform={selectedPlatform}
        searchQuery={searchQuery}
        viewMode={viewMode}
        onCategoryChange={setSelectedCategoryId}
        onPlatformChange={setSelectedPlatform}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onAddCategory={() => setIsCategoryManagementOpen(true)}
      />

      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center py-4"
          >
            <LiquidSpinner size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container py-3 px-2">
        {items.length === 0 ? (
          <EmptyState onAddClick={handleAddClick} />
        ) : filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
          </motion.div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <TextThumbnailCard
                  item={item}
                  category={getCategoryById(item.category_id || '')}
                  onClick={() => setSelectedItem(item)}
                  onRetryAnalysis={() => handleRetryAnalysis(item.id)}
                  highlightQuery={searchQuery}
                />
              </motion.div>
            ))}
          </div>
        ) : viewMode === 'masonry' ? (
          <div className="masonry-grid">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
              >
                <GlassCard
                  item={item}
                  category={getCategoryById(item.category_id || '')}
                  onClick={() => setSelectedItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                  isMasonry={true}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="compact-grid">
            {filteredItems.map((item, index) => (
              <>
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard
                    item={item}
                    category={getCategoryById(item.category_id || '')}
                    onClick={() => setSelectedItem(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                    isMasonry={false}
                  />
                </motion.div>
                {/* Insert ad every 6 items for non-premium users */}
                {!usageData.isPremium && (index + 1) % 6 === 0 && index < filteredItems.length - 1 && (
                  <div key={`ad-${index}`} className="col-span-full">
                    <AdBanner slot="feed" isPremium={usageData.isPremium} className="my-2" />
                  </div>
                )}
              </>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="fixed bottom-28 right-4 glass-button w-12 h-12 rounded-full flex items-center justify-center neon-glow"
        >
          <RefreshCw className={`h-5 w-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </main>

      <GlassDock
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onAdd={handleAddClick}
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

      {/* Share Collection Modal */}
      <ShareCollectionModal
        isOpen={isShareCollectionOpen}
        onClose={() => setIsShareCollectionOpen(false)}
        category={selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined}
        items={filteredItems}
      />

      <GlassToast
        show={toastState.show}
        type={toastState.type}
        message={toastState.message}
        onClose={() => setToastState(prev => ({ ...prev, show: false }))}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        reason={upgradeReason}
      />

      {/* Category Share Button - Show when a category is selected */}
      {selectedCategoryId && filteredItems.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsShareCollectionOpen(true)}
          className="fixed bottom-28 left-4 glass-button w-12 h-12 rounded-full flex items-center justify-center neon-glow"
        >
          <Share2 className="h-5 w-5 text-muted-foreground" />
        </motion.button>
      )}
    </div>
  );
};

export default Index;
