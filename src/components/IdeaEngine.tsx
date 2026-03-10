import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Lightbulb, Loader2, Trash2, CalendarDays, Save, Sparkles, BookOpen, Key, FileEdit, Eye, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDbItems, DbItem } from '@/hooks/useDbItems';
import { useDbCategories } from '@/hooks/useDbCategories';
import { useUsageLimits, FREE_LIMITS } from '@/hooks/useUsageLimits';
import { useToast } from '@/hooks/use-toast';
import { CreatorChannel } from '@/hooks/useCreatorChannels';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Platform } from '@/types/pickstack';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DraftModal } from '@/components/DraftModal';

interface ContentIdea {
  id: string;
  title: string;
  hook: string | null;
  format: string | null;
  content_layers: { layer_name: string; description: string }[];
  hashtags: string[];
  estimated_engagement: string | null;
  reference_item_ids: string[];
  channel_id: string | null;
  status: string | null;
  scheduled_date: string | null;
  draft_content: string | null;
}

interface IdeaEngineProps {
  channel: CreatorChannel;
  onBack: () => void;
  initialKeywords?: string | null;
}

const FREE_IDEA_LIMIT = 3;

const FORMAT_LABELS: Record<string, string> = {
  carousel: '캐러셀',
  reel: '릴스',
  thread: '스레드',
  long_form: '롱폼',
};

const ENGAGEMENT_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  mid: { label: 'Mid', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
};

export function IdeaEngine({ channel, onBack, initialKeywords }: IdeaEngineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, loading: itemsLoading } = useDbItems();
  const { categories, getCategoryById } = useDbCategories();
  const { usageData, refetch: refetchUsage } = useUsageLimits();

  const [step, setStep] = useState<'select' | 'loading' | 'result'>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'reference' | 'keyword' | 'auto'>(initialKeywords ? 'keyword' : 'reference');
  const [keywords, setKeywords] = useState(initialKeywords || '');
  const [draftModalIdea, setDraftModalIdea] = useState<ContentIdea | null>(null);

  const canGenerate = usageData.isPremium || (usageData as any).ideaGenerationCount < FREE_IDEA_LIMIT;
  const ideasRemaining = usageData.isPremium ? Infinity : FREE_IDEA_LIMIT - ((usageData as any).ideaGenerationCount || 0);

  const filteredItems = useMemo(() => {
    if (!filterCategoryId) return items;
    return items.filter(item => item.category_id === filterCategoryId);
  }, [items, filterCategoryId]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 10) {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (mode === 'reference' && selectedIds.size === 0) return;
    if (mode === 'keyword' && keywords.trim().length < 2) return;
    // auto mode: no input validation needed
    if (!canGenerate) {
      toast({ title: '월간 아이디어 생성 한도 초과', description: 'Pro로 업그레이드하세요.', variant: 'destructive' });
      return;
    }

    setStep('loading');
    setIsGenerating(true);

    try {
      const body: any = { channel_id: channel.id };
      if (mode === 'reference') {
        body.item_ids = [...selectedIds];
      } else {
        body.keywords = keywords.trim();
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', { body });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const ideas: ContentIdea[] = (data.ideas || []).map((idea: any) => ({
        ...idea,
        content_layers: Array.isArray(idea.content_layers) ? idea.content_layers : [],
        hashtags: idea.hashtags || [],
        reference_item_ids: idea.reference_item_ids || [],
        draft_content: idea.draft_content || null,
      }));

      setGeneratedIdeas(ideas);
      setStep('result');
      refetchUsage();
      toast({ title: `${ideas.length}개 아이디어가 생성되었습니다!` });
    } catch (err: any) {
      console.error('Idea generation error:', err);
      toast({ title: '아이디어 생성 실패', description: err.message || '다시 시도해주세요.', variant: 'destructive' });
      setStep('select');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const { error } = await supabase.from('content_ideas').delete().eq('id', ideaId);
    if (error) {
      toast({ title: '삭제 실패', variant: 'destructive' });
      return;
    }
    setGeneratedIdeas(prev => prev.filter(i => i.id !== ideaId));
    toast({ title: '아이디어가 삭제되었습니다' });
  };

  const handleScheduleIdea = async (ideaId: string, date: string) => {
    const { error } = await supabase
      .from('content_ideas')
      .update({ scheduled_date: date, status: 'scheduled' })
      .eq('id', ideaId);
    if (error) {
      toast({ title: '날짜 지정 실패', variant: 'destructive' });
      return;
    }
    setGeneratedIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, scheduled_date: date, status: 'scheduled' } : i));
    toast({ title: '날짜가 지정되었습니다' });
  };

  // Step 1: Reference Selection
  if (step === 'select') {
    const canSubmit = mode === 'reference' ? selectedIds.size > 0 && canGenerate : keywords.trim().length >= 2 && canGenerate;

    return (
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 glass-dock border-b-0">
          <div className="container flex items-center h-12 px-3 gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">아이디어 생성</h1>
              <p className="text-[10px] text-muted-foreground truncate">{channel.name} · {channel.platform}</p>
            </div>
            {!usageData.isPremium && (
              <span className="text-[10px] text-amber-500 shrink-0">
                남은 횟수: {Math.max(0, ideasRemaining)}회
              </span>
            )}
          </div>
        </header>

        <main className="container px-3 py-4 space-y-3">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
            <button
              onClick={() => setMode('reference')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'reference' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              📚 레퍼런스 기반
            </button>
            <button
              onClick={() => setMode('keyword')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'keyword' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Key className="h-3.5 w-3.5" />
              🔑 키워드 기반
            </button>
          </div>

          {mode === 'keyword' ? (
            /* Keyword mode */
            <div className="space-y-4">
              <Textarea
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder={"오늘의 주제나 키워드를 입력하세요\n예: 기준금리 동결, 아파트 평면도 분석, 현관 풍수"}
                className="min-h-[160px] text-sm bg-muted/30 border-border/50 focus:border-primary/50"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {keywords.trim().length < 2 ? '최소 2글자 이상 입력해주세요' : `${keywords.trim().length}글자 입력됨`}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  아이디어 생성하기
                </motion.button>
              </div>
            </div>
          ) : (
            /* Reference mode (existing) */
            <>
              {/* Category filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setFilterCategoryId(null)}
                  className={`glass-chip px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ${!filterCategoryId ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}
                >
                  전체
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategoryId(cat.id === filterCategoryId ? null : cat.id)}
                    className={`glass-chip px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ${filterCategoryId === cat.id ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Selection count */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{selectedIds.size}</span>/10개 선택됨
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  아이디어 생성하기
                </motion.button>
              </div>

              {/* Item list */}
              {itemsLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <p className="text-sm text-muted-foreground">저장된 아이템이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item, i) => {
                    const isSelected = selectedIds.has(item.id);
                    const cat = getCategoryById(item.category_id || '');
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => toggleItem(item.id)}
                        className={`glass-card p-2.5 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="shrink-0"
                          />
                          {item.thumbnail_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                              <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <PlatformIcon platform={item.platform as Platform} size="sm" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{item.platform}</span>
                              {cat && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                  {cat.icon} {cat.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // Step 2: Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-accent animate-pulse" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-primary/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground mb-1">AI가 아이디어를 만들고 있어요...</h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'reference' ? `${selectedIds.size}개 레퍼런스를 분석 중` : '키워드를 분석 중'}
            </p>
          </div>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Step 3: Results
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 glass-dock border-b-0">
        <div className="container flex items-center h-12 px-3 gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground">생성된 아이디어</h1>
            <p className="text-[10px] text-muted-foreground truncate">{channel.name} · {generatedIdeas.length}개</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setStep('select'); setSelectedIds(new Set()); setGeneratedIdeas([]); }}
            className="glass-chip px-3 py-1.5 text-[10px] font-semibold text-primary"
          >
            다시 생성
          </motion.button>
        </div>
      </header>

      <main className="container px-3 py-4 space-y-3">
        {generatedIdeas.map((idea, i) => {
          const engConfig = ENGAGEMENT_CONFIG[idea.estimated_engagement || 'mid'] || ENGAGEMENT_CONFIG.mid;
          return (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 space-y-3"
            >
              {/* Title */}
              <h3 className="text-sm font-bold text-foreground leading-snug">{idea.title}</h3>

              {/* Hook */}
              {idea.hook && (
                <div className="border-l-2 border-accent/50 pl-3">
                  <p className="text-xs text-muted-foreground italic">"{idea.hook}"</p>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {idea.format && (
                  <span className="glass-chip px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {FORMAT_LABELS[idea.format] || idea.format}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${engConfig.className}`}>
                  {engConfig.label}
                </span>
              </div>

              {/* Content Layers */}
              {idea.content_layers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">콘텐츠 구성</p>
                  {idea.content_layers.map((layer, j) => (
                    <div key={j} className="flex gap-2 text-xs">
                      <span className="text-primary font-semibold shrink-0">L{j + 1}</span>
                      <div>
                        <span className="font-medium text-foreground">{layer.layer_name}</span>
                        <span className="text-muted-foreground"> — {layer.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {idea.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.hashtags.map((tag, j) => (
                    <span key={j} className="text-[10px] text-accent">
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <button
                  onClick={() => handleDeleteIdea(idea.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleScheduleIdea(idea.id, today);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <CalendarDays className="h-3 w-3" />
                  {idea.scheduled_date ? idea.scheduled_date : '날짜 지정'}
                </button>
                <button
                  onClick={() => setDraftModalIdea(idea)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-accent hover:bg-accent/10 transition-colors"
                >
                  {idea.draft_content ? <Eye className="h-3 w-3" /> : <FileEdit className="h-3 w-3" />}
                  {idea.draft_content ? '초안 보기' : '초안 생성'}
                </button>
                {idea.status === 'scheduled' && (
                  <span className="ml-auto text-[10px] text-primary font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" /> 저장됨
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Draft Modal */}
      {draftModalIdea && (
        <DraftModal
          open={!!draftModalIdea}
          onClose={() => setDraftModalIdea(null)}
          ideaId={draftModalIdea.id}
          ideaTitle={draftModalIdea.title}
          ideaFormat={draftModalIdea.format}
          channelName={channel.name}
          existingDraft={draftModalIdea.draft_content}
          onDraftGenerated={(ideaId, draft) => {
            setGeneratedIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, draft_content: draft, status: 'drafted' } : i));
          }}
        />
      )}
    </div>
  );
}
