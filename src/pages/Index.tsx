import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTips, Tip } from '@/hooks/useTips';
import { useArchiCategories } from '@/hooks/useArchiCategories';
import { useGroqAnalysis } from '@/hooks/useGroqAnalysis';
import { Header } from '@/components/Header';
import { TipCard } from '@/components/TipCard';
import { SaveModal } from '@/components/SaveModal';
import { GlassDock } from '@/components/GlassDock';
import { EmptyState } from '@/components/EmptyState';
import { LiquidSpinner } from '@/components/LiquidSpinner';
import { GlassToast } from '@/components/GlassToast';
import { GlassChip, GlassChipGroup } from '@/components/GlassChip';
import { TipsTrendRadar } from '@/components/TipsTrendRadar';
import { RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user } = useAuth();
  const { tips, loading: tipsLoading, addTip, updateTip, deleteTip, refetch } = useTips();
  const { categories, loading: categoriesLoading, getCategoryById, getDefaultCategory } = useArchiCategories();
  const { analyzeTip, analyzingIds } = useGroqAnalysis();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'creator' | 'report' | 'dashboard'>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast state
  const [toastState, setToastState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'loading' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastState({ show: true, type, message });
    setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 2500);
  };

  // Filter tips
  const filteredTips = useMemo(() => {
    return tips.filter(tip => {
      if (selectedCategoryId && tip.category !== selectedCategoryId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = tip.title?.toLowerCase().includes(q);
        const contentMatch = tip.content?.toLowerCase().includes(q);
        const tagMatch = tip.tags?.some(t => t.toLowerCase().includes(q));
        const aiTagMatch = tip.ai_tags?.some(t => t.toLowerCase().includes(q));
        const compMatch = tip.competition_name?.toLowerCase().includes(q);
        const summaryMatch = tip.ai_summary?.toLowerCase().includes(q);
        return titleMatch || contentMatch || tagMatch || aiTagMatch || compMatch || summaryMatch;
      }
      return true;
    });
  }, [tips, selectedCategoryId, searchQuery]);

  const handleAddClick = useCallback(() => {
    setIsSaveModalOpen(true);
  }, []);

  const handleSave = async (tipData: Parameters<typeof addTip>[0]) => {
    if (editingTip) {
      const success = await updateTip(editingTip.id, tipData);
      if (success) {
        showToast('success', 'Tip updated!');
        setEditingTip(null);
      }
      return;
    }

    const saved = await addTip(tipData);
    if (saved) {
      showToast('success', 'Tip saved!');

      // Trigger Groq AI analysis in the background
      showToast('info', 'AI 분석 시작...');
      analyzeTip(saved, categories).then((result) => {
        if (result) {
          // Refresh to show updated AI fields
          refetch();
          showToast('success', 'AI 분석 완료!');
        }
      });
    }
  };

  const handleEdit = (tip: Tip) => {
    setEditingTip(tip);
    setIsSaveModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTip(id);
    showToast('success', 'Deleted');
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('success', 'Updated');
    }, 500);
  }, [refetch]);

  // Loading state
  if (categoriesLoading || tipsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LiquidSpinner size="lg" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Loading...
          </motion.p>
        </div>
      </div>
    );
  }

  // Dashboard tab — Trend Radar
  if (currentTab === 'dashboard') {
    return (
      <>
        <Header />
        <TipsTrendRadar tips={tips} categories={categories} getCategoryById={getCategoryById} />
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  // Other non-home tabs — placeholder
  if (currentTab !== 'home') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Coming soon</p>
        </div>
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <Header />

      {/* Filter Bar */}
      <div className="sticky top-12 z-20 glass-dock border-t-0 border-b border-border/30">
        <div className="container px-3 py-2.5 space-y-2.5">
          {/* Search Row */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 glass-chip px-3 py-2 flex-1'
            )}>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search tips by title, tag, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <GlassChipGroup>
              <GlassChip
                selected={selectedCategoryId === null}
                onClick={() => setSelectedCategoryId(null)}
              >
                All
              </GlassChip>
              {categories.map(cat => (
                <GlassChip
                  key={cat.id}
                  selected={selectedCategoryId === cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  color={cat.color}
                >
                  {cat.name}
                </GlassChip>
              ))}
            </GlassChipGroup>
          </div>
        </div>
      </div>

      {/* Refresh Indicator */}
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
        {tips.length === 0 ? (
          <EmptyState onAddClick={handleAddClick} />
        ) : filteredTips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-sm text-muted-foreground">No results found</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <TipCard
                  tip={tip}
                  category={getCategoryById(tip.category)}
                  onEdit={() => handleEdit(tip)}
                  onDelete={() => handleDelete(tip.id)}
                  isAnalyzing={analyzingIds.has(tip.id)}
                />
              </motion.div>
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

      <SaveModal
        isOpen={isSaveModalOpen}
        categories={categories}
        getDefaultCategory={getDefaultCategory}
        onClose={() => { setIsSaveModalOpen(false); setEditingTip(null); }}
        onSave={handleSave}
        editingTip={editingTip}
      />

      <GlassToast
        show={toastState.show}
        type={toastState.type}
        message={toastState.message}
        onClose={() => setToastState(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default Index;
