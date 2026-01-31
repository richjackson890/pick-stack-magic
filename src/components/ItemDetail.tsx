import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { DbItem, AiStatus } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { FallbackCover } from '@/components/FallbackCover';
import { GlassChip } from '@/components/GlassChip';
import { LiquidSpinner, AnalysisSteps } from '@/components/LiquidSpinner';
import { Textarea } from '@/components/ui/textarea';
import { ShareButton } from '@/components/ShareButton';
import { useGenerateCover } from '@/hooks/useGenerateCover';
import { TextThumbnailCard, isForceTextThumb, fallbackKeywords } from '@/components/PickStackThumbs';
import { ExternalLink, Calendar, Trash2, RefreshCw, AlertCircle, X, Sparkles, ImagePlus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ItemDetailProps {
  item: DbItem | null;
  categories: DbCategory[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<DbItem>) => void;
  onDelete?: (id: string) => void;
  onRefetch?: () => void;
}

function isProcessingStuck(item: DbItem): boolean {
  if (item.ai_status !== 'processing') return false;
  if (!item.ai_started_at) return false;
  const startedAt = new Date(item.ai_started_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return (now - startedAt) > fiveMinutes;
}

export function ItemDetail({ item, categories, isOpen, onClose, onUpdate, onDelete, onRefetch }: ItemDetailProps) {
  const { toast } = useToast();
  const { generateCover, isGenerating } = useGenerateCover();
  const [note, setNote] = useState(item?.user_note || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowDebug(params.get('debug') === '1');
  }, []);

  useEffect(() => { 
    if (item) setNote(item.user_note || ''); 
  }, [item]);

  // Simulate analysis steps
  useEffect(() => {
    if (isReanalyzing) {
      setAnalysisStep(0);
      const timer1 = setTimeout(() => setAnalysisStep(1), 2000);
      const timer2 = setTimeout(() => setAnalysisStep(2), 5000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isReanalyzing]);

  // 인스타/쓰레드는 무조건 텍스트 썸네일 사용 (훅은 조건문 전에 위치해야 함)
  const forceTextThumbnail = useMemo(() => {
    if (!item) return false;
    return isForceTextThumb(item.url) || isForceTextThumb(item.thumbnail_url);
  }, [item?.url, item?.thumbnail_url]);
  
  const keywords = useMemo(() => {
    if (!item) return [];
    return (item.tags?.length ? item.tags : fallbackKeywords(item.title)) as string[];
  }, [item?.tags, item?.title]);

  if (!item) return null;

  const currentCategory = categories.find(c => c.id === item.category_id);
  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  const isStuck = isProcessingStuck(item);
  const isAiGenerated = item.thumbnail_url?.includes('/covers/');

  const handleNoteChange = (value: string) => { 
    setNote(value); 
    onUpdate?.(item.id, { user_note: value }); 
  };
  
  const handleCategoryChange = (categoryId: string) => { 
    onUpdate?.(item.id, { category_id: categoryId }); 
    setShowCategoryPicker(false); 
  };

  const handleDelete = () => {
    onDelete?.(item.id);
    onClose();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleReanalyze = async (mode: 'light' | 'deep' = 'light') => {
    setIsReanalyzing(true);
    try {
      onUpdate?.(item.id, { ai_status: 'pending', ai_error: null });
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: item.id, mode },
      });
      if (error) {
        toast({ title: '재분석 실패', description: error.message || '다시 시도해주세요.', variant: 'destructive' });
      } else {
        toast({ title: mode === 'deep' ? 'AI 딥 분석 완료' : 'AI 분석 완료', description: '콘텐츠가 분석되었습니다.' });
        onRefetch?.();
      }
    } catch (e: any) {
      toast({ title: '재분석 실패', description: e.message || '다시 시도해주세요.', variant: 'destructive' });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const renderSummary = () => {
    const status = item.ai_status || 'pending';
    
    if (isStuck) {
      return (
        <div className="glass-card p-4 border-orange-500/30">
          <h3 className="text-sm font-semibold text-orange-500 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            분석 시간 초과
          </h3>
          <p className="text-xs text-muted-foreground mb-3">5분 이상 처리 중입니다. 재시도해주세요.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReanalyze('light')}
            disabled={isReanalyzing}
            className="glass-button px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            다시 시도
          </motion.button>
        </div>
      );
    }
    
    if (status === 'pending' && !isReanalyzing) {
      return (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">⏳ 분석 대기중</h3>
          <p className="text-xs text-muted-foreground mb-3">AI 분석이 아직 시작되지 않았습니다.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReanalyze('light')}
            className="gradient-primary px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            지금 분석하기
          </motion.button>
        </div>
      );
    }
    
    if (status === 'processing' || isReanalyzing) {
      return (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <LiquidSpinner size="sm" />
            <h3 className="text-sm font-semibold text-foreground">AI 분석 중...</h3>
          </div>
          <AnalysisSteps currentStep={analysisStep} />
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="glass-card p-4 border-destructive/30">
          <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            분석 실패
          </h3>
          <p className="text-xs text-muted-foreground mb-3">{item.ai_error || '콘텐츠를 분석하는 중 오류가 발생했습니다.'}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleReanalyze('light')}
            disabled={isReanalyzing}
            className="glass-button px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            다시 시도
          </motion.button>
        </div>
      );
    }
    
    const summaryLines = item.summary_3lines.filter(Boolean);
    
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">✨ AI 3줄 요약</h3>
          <div className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReanalyze('light')}
              disabled={isReanalyzing}
              className="glass-button w-7 h-7 flex items-center justify-center"
            >
              <RefreshCw className={`h-3 w-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReanalyze('deep')}
              disabled={isReanalyzing}
              className="glass-button px-2 h-7 text-2xs font-medium"
            >
              딥
            </motion.button>
          </div>
        </div>
        {summaryLines.length > 0 ? (
          <ul className="space-y-2.5">
            {summaryLines.map((line, idx) => (
              <motion.li 
                key={idx} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"
              >
                <span className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-2xs font-bold text-white shrink-0">
                  {idx + 1}
                </span>
                {line}
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">요약 정보가 없습니다.</p>
        )}
        {item.ai_confidence !== null && (
          <p className="text-2xs text-muted-foreground mt-3">
            {item.analysis_mode === 'deep' ? '딥' : '라이트'} 분석 • 신뢰도: {Math.round((item.ai_confidence || 0) * 100)}%
          </p>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-hidden"
          >
            <div className="glass-sheet rounded-t-3xl overflow-y-auto max-h-[90vh] scrollbar-glass">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
                {/* Hero Image */}
                <div className="relative -mx-4 rounded-2xl overflow-hidden">
                  {/* 인스타/쓰레드는 무조건 텍스트 썸네일 */}
                  {forceTextThumbnail ? (
                    <div className="w-full aspect-video">
                      <TextThumbnailCard
                        title={item.title}
                        keywords={keywords}
                        category={currentCategory?.name}
                      />
                    </div>
                  ) : item.thumbnail_url ? (
                    <>
                      <img src={item.thumbnail_url} alt={item.title} className="w-full aspect-video object-cover" />
                      {/* AI Generated indicator */}
                      {isAiGenerated && (
                        <div className="absolute top-12 right-3 flex items-center gap-1 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          AI 생성
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full aspect-video">
                      <TextThumbnailCard
                        title={item.title}
                        keywords={keywords}
                        category={currentCategory?.name}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  
                  {/* Close Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="absolute top-3 right-3 glass-button w-8 h-8 flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="glass-chip p-1">
                      <PlatformIcon platform={item.platform} size="sm" />
                    </div>
                    {currentCategory && (
                      <span className="glass-chip text-2xs font-semibold px-2 py-1 flex items-center gap-1" style={{ backgroundColor: `${currentCategory.color}cc`, color: 'white' }}>
                        {currentCategory.icon} {currentCategory.name}
                      </span>
                    )}
                  </div>
                  
                  {/* External Link Button */}
                  {item.url && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(item.url!, '_blank')}
                      className="absolute bottom-3 right-3 gradient-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      원본
                    </motion.button>
                  )}
                </div>

                {/* AI Cover Generation Button - 인스타/쓰레드일 경우 숨김 */}
                {!forceTextThumbnail && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      const newUrl = await generateCover({
                        itemId: item.id,
                        title: item.title,
                        summary: item.summary_3lines?.[0],
                        tags: item.tags,
                        categoryName: currentCategory?.name,
                        platform: item.platform,
                        sourceUrl: item.url || undefined,
                      });
                      if (newUrl) {
                        onUpdate?.(item.id, { thumbnail_url: newUrl });
                        onRefetch?.();
                      }
                    }}
                    disabled={isGenerating}
                    className="glass-button w-full py-2.5 font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <LiquidSpinner size="sm" />
                        AI 커버 생성 중...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-4 w-4" />
                        {item.thumbnail_url ? '커버 다시 생성' : 'AI 커버 생성'}
                      </>
                    )}
                  </motion.button>
                )}

                {/* Title & Date */}
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-snug mb-1">{item.title}</h1>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{formattedDate}
                  </span>
                </div>

                {renderSummary()}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className="glass-chip text-xs text-muted-foreground px-2 py-0.5">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* Category Picker */}
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground">카테고리</h3>
                    <button onClick={() => setShowCategoryPicker(!showCategoryPicker)} className="text-xs text-primary font-medium">
                      {showCategoryPicker ? '닫기' : '변경'}
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {showCategoryPicker ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                      >
                        {categories.sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
                          <GlassChip
                            key={cat.id}
                            selected={item.category_id === cat.id}
                            color={cat.color}
                            icon={cat.icon ? <span>{cat.icon}</span> : undefined}
                            onClick={() => handleCategoryChange(cat.id)}
                            size="sm"
                          >
                            {cat.name}
                          </GlassChip>
                        ))}
                      </motion.div>
                    ) : currentCategory && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowCategoryPicker(true)}
                        className="glass-chip text-xs font-medium px-3 py-1.5 flex items-center gap-1"
                        style={{ backgroundColor: `${currentCategory.color}cc`, color: 'white' }}
                      >
                        {currentCategory.icon} {currentCategory.name}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Note */}
                <div className="glass-card p-3 space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">나의 메모</h3>
                  <Textarea 
                    value={note} 
                    onChange={(e) => handleNoteChange(e.target.value)} 
                    placeholder="메모를 입력하세요..." 
                    className="min-h-[80px] text-sm bg-transparent border-border/50 focus:border-primary/50" 
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {item.url && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(item.url!, '_blank')}
                      className="flex-1 glass-button py-3 font-medium flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      원본 열기
                    </motion.button>
                  )}
                  <ShareButton itemId={item.id} title={item.title} variant="button" className="flex-1" />
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="glass-button w-full py-3 font-medium text-destructive flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제하기
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-sheet">
                    <AlertDialogHeader>
                      <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 항목을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="glass-button">취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
