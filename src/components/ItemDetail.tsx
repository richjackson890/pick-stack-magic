import { useState, useEffect } from 'react';
import { DbItem, AiStatus } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { CategoryChip } from '@/components/CategoryBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Calendar, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
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

interface ItemDetailProps {
  item: DbItem | null;
  categories: DbCategory[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<DbItem>) => void;
  onDelete?: (id: string) => void;
  onRefetch?: () => void;
}

export function ItemDetail({ item, categories, isOpen, onClose, onUpdate, onDelete, onRefetch }: ItemDetailProps) {
  const { toast } = useToast();
  const [note, setNote] = useState(item?.user_note || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => { if (item) setNote(item.user_note || ''); }, [item]);

  if (!item) return null;

  const currentCategory = categories.find(c => c.id === item.category_id);
  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

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

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      console.log('[ItemDetail] Reanalyzing item:', item.id);
      
      // Update status to pending first
      onUpdate?.(item.id, { ai_status: 'pending', ai_error: null });
      
      const { error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: item.id },
      });

      if (error) {
        console.error('[ItemDetail] Reanalysis error:', error);
        toast({
          title: '재분석 실패',
          description: error.message || '다시 시도해주세요.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'AI 재분석 완료',
          description: '콘텐츠가 다시 분석되었습니다.',
        });
        // Refetch to get updated data
        onRefetch?.();
      }
    } catch (e: any) {
      console.error('[ItemDetail] Reanalysis failed:', e);
      toast({
        title: '재분석 실패',
        description: e.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const renderSummary = () => {
    const status = item.ai_status || 'pending';
    
    if (status === 'pending' || status === 'processing' || isReanalyzing) {
      return (
        <div className="bg-secondary/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 분석 중...
          </h3>
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="bg-destructive/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            분석 실패
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {item.ai_error || '콘텐츠를 분석하는 중 오류가 발생했습니다.'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReanalyze}
            disabled={isReanalyzing}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            다시 시도
          </Button>
        </div>
      );
    }
    
    // status === 'done'
    const summaryLines = item.summary_3lines.filter(Boolean);
    
    if (summaryLines.length === 0) {
      return (
        <div className="bg-secondary/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">✨ AI 3줄 요약</h3>
          <p className="text-sm text-muted-foreground">요약 정보가 없습니다.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleReanalyze}
            disabled={isReanalyzing}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            AI 분석 요청
          </Button>
        </div>
      );
    }
    
    return (
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">✨ AI 3줄 요약</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2"
            onClick={handleReanalyze}
            disabled={isReanalyzing}
          >
            <RefreshCw className={`h-3 w-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ul className="space-y-2.5">
          {summaryLines.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
              <span className="text-primary font-semibold shrink-0">{idx + 1}.</span>{line}
            </li>
          ))}
        </ul>
        {item.ai_confidence !== null && (
          <p className="text-[10px] text-muted-foreground mt-3">
            AI 분류 신뢰도: {Math.round((item.ai_confidence || 0) * 100)}%
          </p>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="sr-only"><SheetTitle>{item.title}</SheetTitle></SheetHeader>
        <div className="max-w-2xl mx-auto space-y-4 pb-6">
          <div className="relative -mx-6 -mt-6 mb-4">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.title} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center" style={{ backgroundColor: currentCategory?.color || '#6b7280' }}>
                <PlatformIcon platform={item.platform} size="lg" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
              <PlatformIcon platform={item.platform} size="md" />
              {currentCategory && <span className="text-xs font-medium text-white px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: currentCategory.color }}>{currentCategory.icon} {currentCategory.name}</span>}
            </div>
            {item.url && <Button size="sm" className="absolute top-3 right-3" onClick={() => window.open(item.url!, '_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />원본</Button>}
          </div>
          <div><h1 className="text-lg font-bold text-foreground leading-snug mb-1">{item.title}</h1><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{formattedDate}</span></div>
          
          {renderSummary()}
          
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{tag}</span>)}
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">카테고리</h3>
              <button onClick={() => setShowCategoryPicker(!showCategoryPicker)} className="text-xs text-primary hover:underline">{showCategoryPicker ? '닫기' : '변경'}</button>
            </div>
            {showCategoryPicker ? (
              <div className="flex flex-wrap gap-1.5">
                {categories.sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
                  <CategoryChip key={cat.id} category={cat} selected={item.category_id === cat.id} onClick={() => handleCategoryChange(cat.id)} />
                ))}
              </div>
            ) : currentCategory && (
              <button onClick={() => setShowCategoryPicker(true)} className="text-xs font-medium text-white px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: currentCategory.color }}>
                {currentCategory.icon} {currentCategory.name}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">나의 메모</h3>
            <Textarea value={note} onChange={(e) => handleNoteChange(e.target.value)} placeholder="메모를 입력하세요..." className="min-h-[80px] text-sm" />
          </div>
          
          {item.url && <Button variant="outline" className="w-full" onClick={() => window.open(item.url!, '_blank')}><ExternalLink className="h-4 w-4 mr-2" />원본 열기</Button>}
          
          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                삭제하기
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 항목을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
