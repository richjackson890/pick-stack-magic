import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTips, Tip } from '@/hooks/useTips';
import { ViewMode } from '@/components/TipCard';
import { useArchiCategories } from '@/hooks/useArchiCategories';
import { useGroqAnalysis } from '@/hooks/useGroqAnalysis';
import { useTeam } from '@/hooks/useTeam';
import { useTipLikes } from '@/hooks/useTipLikes';
import { useTipComments } from '@/hooks/useTipComments';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/Header';
import { TipCard } from '@/components/TipCard';
import { SaveModal } from '@/components/SaveModal';
import { GlassDock } from '@/components/GlassDock';
import { EmptyState } from '@/components/EmptyState';
import { LiquidSpinner } from '@/components/LiquidSpinner';
import { GlassToast } from '@/components/GlassToast';
import { GlassChip, GlassChipGroup } from '@/components/GlassChip';
import { TipsTrendRadar } from '@/components/TipsTrendRadar';
import { StatsTab } from '@/components/StatsTab';
import { TeamTab } from '@/components/TeamTab';
import { AIReportTab } from '@/components/AIReportTab';
import { TipDetailModal } from '@/components/TipDetailModal';
import { InstallBanner } from '@/components/InstallBanner';
import { WorkDashboard } from '@/components/WorkDashboard';
import { CalendarView } from '@/components/CalendarView';
import { useWorkDashboard } from '@/hooks/useWorkDashboard';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TaskAssignmentPopup } from '@/components/TaskAssignmentPopup';
import { RefreshCw, Search, X, LayoutGrid, List, ArrowUpDown, Bookmark, Settings, Plus, Pencil, Trash2, Check, Undo2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user } = useAuth();
  const { tips, deletedTips, loading: tipsLoading, addTip, updateTip, deleteTip, restoreTip, refetch } = useTips();
  const { categories, loading: categoriesLoading, getCategoryById, getDefaultCategory, addCategory, updateCategory, deleteCategory } = useArchiCategories();
  const { analyzeTip, analyzingIds } = useGroqAnalysis();
  const { team, members: teamMembers } = useTeam();
  const { projects: calProjects, events: calEvents, leaves: calLeaves } = useWorkDashboard(team?.id);
  const { toggleLike, isLiked, setInitialCount, getCount } = useTipLikes();
  const { fetchCommentCount, getCount: getCommentCount, commentCounts } = useTipComments();
  const { toggleBookmark, isBookmarked, bookmarkedIds } = useBookmarks();
  const { notifications, unreadCount, newTaskAssignment, dismissTaskAssignment, markAsRead, markAllAsRead, createNotification } = useNotifications();

  // Auto-dismiss task toast after 5s and mark as read
  const handleDismissTaskToast = useCallback(() => {
    if (newTaskAssignment) {
      markAsRead(newTaskAssignment.id);
    }
    dismissTaskAssignment();
  }, [newTaskAssignment, markAsRead, dismissTaskAssignment]);

  useEffect(() => {
    if (!newTaskAssignment) return;
    const timer = setTimeout(handleDismissTaskToast, 5000);
    return () => clearTimeout(timer);
  }, [newTaskAssignment, handleDismissTaskToast]);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('tipViewMode') as ViewMode) || 'grid';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [detailTip, setDetailTip] = useState<Tip | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'creator' | 'calendar' | 'report' | 'dashboard'>('home');
  const [sortMode, setSortMode] = useState<'latest' | 'likes' | 'comments'>('latest');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [homeSubTab, setHomeSubTab] = useState<'tips' | 'work'>('tips');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Category management state
  const [catMgmtOpen, setCatMgmtOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catAdding, setCatAdding] = useState(false);

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

  // Filter + sort tips
  const filteredTips = useMemo(() => {
    const filtered = tips.filter(tip => {
      if (showBookmarksOnly && !bookmarkedIds.has(tip.id)) return false;
      if (selectedCategoryId && tip.category !== selectedCategoryId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = tip.title?.toLowerCase().includes(q);
        const contentMatch = tip.content?.toLowerCase().includes(q);
        const tagMatch = tip.tags?.some(t => t.toLowerCase().includes(q));
        const aiTagMatch = tip.ai_tags?.some(t => t.toLowerCase().includes(q));
        const compMatch = tip.competition_name?.toLowerCase().includes(q);
        const summaryMatch = tip.ai_summary?.toLowerCase().includes(q);
        const authorMatch = tip.profiles?.name?.toLowerCase().includes(q)
          || tip.profiles?.email?.toLowerCase().includes(q);
        const categoryMatch = getCategoryById(tip.category)?.name?.toLowerCase().includes(q);
        return titleMatch || contentMatch || tagMatch || aiTagMatch || compMatch || summaryMatch || authorMatch || categoryMatch;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortMode === 'comments') return (getCommentCount(b.id) || 0) - (getCommentCount(a.id) || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tips, selectedCategoryId, searchQuery, sortMode, showBookmarksOnly, bookmarkedIds, getCategoryById, getCommentCount]);

  // Initialize like counts and comment counts
  useEffect(() => {
    tips.forEach(tip => setInitialCount(tip.id, tip.likes));
    if (tips.length > 0) fetchCommentCount(tips.map(t => t.id));
  }, [tips, setInitialCount, fetchCommentCount]);

  const handleLike = async (tipId: string) => {
    const result = await toggleLike(tipId);
    if (result) {
      refetch();
      if (result.liked) {
        const tip = tips.find(t => t.id === tipId);
        if (tip) createNotification(tip.user_id, 'like', tipId);
      }
    }
  };

  const handleNotificationClick = useCallback((tipId: string) => {
    const tip = tips.find(t => t.id === tipId);
    if (tip) setDetailTip(tip);
  }, [tips]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === 'grid' ? 'list' : 'grid';
      localStorage.setItem('tipViewMode', next);
      return next;
    });
  }, []);

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

  const [deleteTipId, setDeleteTipId] = useState<string | null>(null);
  const [showDeletedTips, setShowDeletedTips] = useState(false);
  const handleDelete = async (id: string) => {
    setDeleteTipId(id);
  };
  const confirmDeleteTip = async () => {
    if (!deleteTipId) return;
    await deleteTip(deleteTipId);
    showToast('success', 'Deleted');
    setDeleteTipId(null);
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

  // Dashboard tab — Stats
  if (currentTab === 'dashboard') {
    return (
      <>
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
        <StatsTab tips={tips} categories={categories} getCategoryById={getCategoryById} commentCounts={commentCounts} />
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  // Team tab
  if (currentTab === 'creator') {
    return (
      <>
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
        <div className="min-h-screen pb-24">
          <TeamTab />
        </div>
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  // AI Report tab
  if (currentTab === 'report') {
    return (
      <>
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
        <AIReportTab tips={tips} categories={categories} getCategoryById={getCategoryById} />
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  // Calendar tab
  if (currentTab === 'calendar') {
    return (
      <>
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
        <CalendarView projects={calProjects} events={calEvents} leaves={calLeaves} />
        <GlassDock currentTab={currentTab} onTabChange={setCurrentTab} onAdd={handleAddClick} />
      </>
    );
  }

  // Tips feed content (reused in both desktop and mobile)
  const tipsFeed = (
    <>
      {/* Filter Bar */}
      <div className="sticky top-12 z-20 glass-dock border-t-0 border-b border-border/30 lg:static lg:rounded-xl lg:border lg:mb-3">
        <div className="px-3 py-2.5 space-y-2">
          {/* Search Row */}
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center gap-2 glass-chip px-3 py-2 flex-1')}>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search title, tag, author, category..."
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
            <button
              onClick={toggleViewMode}
              className="glass-chip p-2 shrink-0 hover:bg-secondary/80 transition-colors"
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4 text-muted-foreground" />
              ) : (
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Category Chips + Sort */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <GlassChipGroup>
                <GlassChip
                  selected={selectedCategoryId === null && !showBookmarksOnly}
                  onClick={() => { setSelectedCategoryId(null); setShowBookmarksOnly(false); }}
                >
                  All
                </GlassChip>
                <GlassChip
                  selected={showBookmarksOnly}
                  onClick={() => { setShowBookmarksOnly(!showBookmarksOnly); setSelectedCategoryId(null); }}
                  icon={<Bookmark className="h-3 w-3" />}
                >
                  Bookmarks
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
                <button
                  onClick={() => setCatMgmtOpen(true)}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                  title="카테고리 관리"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </GlassChipGroup>
            </div>

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                className="glass-chip appearance-none pl-2 pr-6 py-1.5 text-xs font-medium bg-transparent outline-none cursor-pointer text-muted-foreground"
              >
                <option value="latest">Latest</option>
                <option value="likes">Likes</option>
                <option value="comments">Comments</option>
              </select>
              <ArrowUpDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            {deletedTips.length > 0 && (
              <button
                onClick={() => setShowDeletedTips(true)}
                className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                삭제됨 ({deletedTips.length})
              </button>
            )}
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

      <div className="py-3 px-2">
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
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-2.5'
              : 'space-y-2'
          )}>
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
                  onLike={() => handleLike(tip.id)}
                  onBookmark={() => toggleBookmark(tip.id)}
                  onComment={() => setDetailTip(tip)}
                  onClick={() => setDetailTip(tip)}
                  isLiked={isLiked(tip.id)}
                  isBookmarked={isBookmarked(tip.id)}
                  likeCount={getCount(tip.id, tip.likes)}
                  commentCount={getCommentCount(tip.id)}
                  isAnalyzing={analyzingIds.has(tip.id)}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen pb-24">
      <Header
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      />

      {/* Mobile sub-tab switcher (Tips / Work) — visible only on small screens */}
      <div className="lg:hidden sticky top-12 z-20 glass-dock border-t-0 border-b border-border/30">
        <div className="flex">
          {(['tips', 'work'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setHomeSubTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold text-center transition-colors relative',
                homeSubTab === tab ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {tab === 'tips' ? 'Tips' : 'Work'}
              {homeSubTab === tab && (
                <motion.div
                  layoutId="home-subtab"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: side-by-side layout */}
      <div id="desktop-layout" className="hidden lg:flex container gap-4 pt-3">
        {/* Left: Tips feed 60% */}
        <main id="tips-feed" className="w-[60%] min-w-0">
          {tipsFeed}
        </main>

        {/* Right: Work dashboard 40% */}
        <aside id="dashboard-aside" className="w-[40%] min-w-0 pt-1">
          <div className="sticky top-14">
            <WorkDashboard teamId={team?.id} teamMembers={teamMembers} />
          </div>
        </aside>
      </div>

      {/* Mobile: tab-based layout */}
      <div className="lg:hidden">
        {homeSubTab === 'tips' ? (
          <main className="container">
            {tipsFeed}
          </main>
        ) : (
          <div className="container px-4 pt-3">
            <WorkDashboard teamId={team?.id} teamMembers={teamMembers} />
          </div>
        )}
      </div>

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
        teamId={team?.id}
      />

      <TipDetailModal
        tip={detailTip}
        isOpen={!!detailTip}
        onClose={() => setDetailTip(null)}
        onCommentAdded={(tipId, tipOwnerId, commentText) => {
          console.log('[mention] comment:', commentText);
          console.log('[mention] teamMembers count:', teamMembers.length);
          console.log('[mention] first member keys:', Object.keys(teamMembers[0] || {}));
          console.log('[mention] first member:', JSON.stringify(teamMembers[0]));
          createNotification(tipOwnerId, 'comment', tipId);
          // Parse @mentions and notify mentioned users
          const mentions = commentText.match(/@([^\s@]+)/g)?.map(m => m.slice(1)) || [];
          console.log('[mention] mentions found:', mentions);
          if (mentions.length > 0) {
            const currentName = teamMembers.find(m => m.user_id === user?.id)?.profiles?.display_name
              || teamMembers.find(m => m.user_id === user?.id)?.profiles?.name || '';
            const mentionedUsers = teamMembers.filter(m => {
              const name = m.profiles?.display_name || m.profiles?.name || '';
              return mentions.some(mention => name.includes(mention));
            });
            console.log('[mention] matched users:', mentionedUsers.map(u => u.profiles?.display_name));
            mentionedUsers.forEach(m => {
              if (m.user_id !== user?.id) {
                console.log('[mention] sending notification to:', m.profiles?.display_name, m.user_id);
                createNotification(
                  m.user_id,
                  'mention',
                  tipId,
                  `${currentName}님이 댓글에서 회원님을 언급했습니다: "${commentText.slice(0, 50)}"`
                );
              }
            });
          }
        }}
        onTipUpdated={refetch}
        teamMembers={teamMembers}
      />

      <GlassToast
        show={toastState.show}
        type={toastState.type}
        message={toastState.message}
        onClose={() => setToastState(prev => ({ ...prev, show: false }))}
      />

      <InstallBanner />
      <OnboardingModal />

      {/* Category Management Sheet */}
      <Sheet open={catMgmtOpen} onOpenChange={setCatMgmtOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              카테고리 관리
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                {catEditId === cat.id ? (
                  <>
                    <input value={catIcon} onChange={e => setCatIcon(e.target.value)} className="w-8 text-center text-sm bg-transparent border-b border-primary outline-none" placeholder="📁" />
                    <input value={catName} onChange={e => setCatName(e.target.value)} className="flex-1 min-w-0 text-sm bg-transparent border-b border-primary outline-none" />
                    <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
                    <button onClick={async () => {
                      if (catName.trim()) await updateCategory(cat.id, { name: catName.trim(), icon: catIcon, color: catColor });
                      setCatEditId(null);
                    }} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setCatEditId(null)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0" style={{ backgroundColor: cat.color }}>{cat.icon}</span>
                    <span className="text-sm flex-1 min-w-0 truncate">{cat.name}</span>
                    <button onClick={() => { setCatEditId(cat.id); setCatName(cat.name); setCatIcon(cat.icon); setCatColor(cat.color); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                    {cat.name !== '기타' && (
                      <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </>
                )}
              </div>
            ))}

            {catAdding ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/30">
                <input value={catIcon} onChange={e => setCatIcon(e.target.value)} className="w-8 text-center text-sm bg-transparent border-b border-primary outline-none" placeholder="📁" />
                <input value={catName} onChange={e => setCatName(e.target.value)} className="flex-1 min-w-0 text-sm bg-transparent border-b border-primary outline-none" placeholder="카테고리 이름" autoFocus />
                <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
                <button onClick={async () => {
                  if (catName.trim()) { await addCategory(catName.trim(), catIcon || '📁', catColor); setCatName(''); setCatIcon(''); setCatAdding(false); }
                }} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => { setCatAdding(false); setCatName(''); setCatIcon(''); }} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={() => { setCatName(''); setCatIcon(''); setCatColor('#3b82f6'); setCatAdding(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> 새 카테고리 추가
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Deleted tips modal */}
      <AnimatePresence>
        {showDeletedTips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowDeletedTips(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="glass-card rounded-2xl p-5 w-full max-w-sm mx-4 space-y-3 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">최근 삭제된 팁 ({deletedTips.length})</h3>
                <button onClick={() => setShowDeletedTips(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {deletedTips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">삭제된 팁이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {deletedTips.map(tip => (
                    <div key={tip.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 opacity-70">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tip.title}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(tip.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                      <button
                        onClick={async () => { await restoreTip(tip.id); setShowDeletedTips(deletedTips.length > 1); }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        복구
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTipId}
        message="정말 삭제하시겠습니까?"
        onConfirm={confirmDeleteTip}
        onCancel={() => setDeleteTipId(null)}
      />

      <TaskAssignmentPopup
        notifications={notifications}
        onMarkAsRead={markAsRead}
      />

      {/* Realtime task assignment toast */}
      <AnimatePresence>
        {newTaskAssignment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
          >
            <div className="glass-card rounded-2xl p-6 shadow-2xl max-w-sm w-[90vw] pointer-events-auto">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">📋</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">새 업무 지시가 도착했습니다</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {newTaskAssignment.from_profile?.display_name || newTaskAssignment.from_profile?.name || 'Someone'}님
                  </p>
                  {newTaskAssignment.message && (
                    <p className="text-sm mt-2 line-clamp-3">{newTaskAssignment.message}</p>
                  )}
                </div>
                <button onClick={handleDismissTaskToast} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-1 bg-primary rounded-full animate-shrink" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
