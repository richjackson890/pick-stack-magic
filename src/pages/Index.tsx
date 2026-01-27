import { useState, useEffect, useMemo } from 'react';
import { Platform, SavedItem } from '@/types/pickstack';
import { mockItems, MOCK_CATEGORY_NAMES } from '@/data/mockData';
import { useCategories } from '@/contexts/CategoryContext';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { SavedItemCard } from '@/components/SavedItemCard';
import { ListViewItem } from '@/components/ListViewItem';
import { ItemDetail } from '@/components/ItemDetail';
import { SaveModal } from '@/components/SaveModal';
import { BottomNav } from '@/components/BottomNav';
import { HealthReport } from '@/components/HealthReport';
import { CategoryManagement } from '@/components/CategoryManagement';

const Index = () => {
  const { categories, getCategoryByName } = useCategories();
  
  // Initialize items with proper category IDs
  const [items, setItems] = useState<SavedItem[]>(() => {
    return mockItems.map((item) => {
      const categoryName = MOCK_CATEGORY_NAMES[item.category_id];
      const category = categories.find((c) => c.name === categoryName);
      return {
        ...item,
        category_id: category?.id || categories.find((c) => c.is_default)?.id || item.category_id,
      };
    });
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'health'>('home');

  // Re-map items when categories change (for initial load)
  useEffect(() => {
    if (categories.length > 0) {
      setItems((prev) =>
        prev.map((item) => {
          // Check if the current category_id is valid
          const hasValidCategory = categories.some((c) => c.id === item.category_id);
          if (hasValidCategory) return item;

          // Try to match by mock category name
          const categoryName = MOCK_CATEGORY_NAMES[item.category_id];
          if (categoryName) {
            const category = categories.find((c) => c.name === categoryName);
            if (category) {
              return { ...item, category_id: category.id };
            }
          }

          // Fall back to default category
          const defaultCategory = categories.find((c) => c.is_default);
          return { ...item, category_id: defaultCategory?.id || item.category_id };
        })
      );
    }
  }, [categories]);

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

  // Check if health category is selected
  const healthCategory = categories.find((c) => c.name === '건강');
  const isHealthSelected = selectedCategoryId === healthCategory?.id;

  const handleSave = (newItem: Omit<SavedItem, 'id' | 'created_at'>) => {
    const item: SavedItem = {
      ...newItem,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
  };

  const handleUpdateItem = (id: string, updates: Partial<SavedItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleHealthSummary = () => {
    setCurrentTab('health');
  };

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
        {filteredItems.length === 0 ? (
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
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdateItem}
      />

      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />

      <CategoryManagement
        isOpen={isCategoryManagementOpen}
        onClose={() => setIsCategoryManagementOpen(false)}
      />
    </div>
  );
};

export default Index;
