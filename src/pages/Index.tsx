import { useState, useMemo } from 'react';
import { Category, Platform, SavedItem } from '@/types/pickstack';
import { mockItems } from '@/data/mockData';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { SavedItemCard } from '@/components/SavedItemCard';
import { ListViewItem } from '@/components/ListViewItem';
import { ItemDetail } from '@/components/ItemDetail';
import { SaveModal } from '@/components/SaveModal';
import { BottomNav } from '@/components/BottomNav';
import { HealthReport } from '@/components/HealthReport';

const Index = () => {
  const [items, setItems] = useState<SavedItem[]>(mockItems);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'health'>('home');

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
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
  }, [items, selectedCategory, selectedPlatform, searchQuery]);

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
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <FilterBar
        selectedCategory={selectedCategory}
        selectedPlatform={selectedPlatform}
        searchQuery={searchQuery}
        viewMode={viewMode}
        onCategoryChange={setSelectedCategory}
        onPlatformChange={setSelectedPlatform}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
      />

      <main className="container py-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="masonry-grid">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SavedItemCard
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ListViewItem
                  item={item}
                  onClick={() => setSelectedItem(item)}
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
    </div>
  );
};

export default Index;
