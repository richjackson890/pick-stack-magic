import { useState, useEffect } from 'react';
import { DbItem, AiStatus } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { CategoryChip } from '@/components/CategoryBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Calendar, Trash2, RefreshCw, AlertCircle, Loader2, Bug } from 'lucide-react';
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

// Check if processing is stuck (> 5 minutes)
function isProcessingStuck(item: DbItem): boolean {
  if (item.ai_status !== 'processing') return false;
  if (!item.ai_started_at) return false;
  
  const startedAt = new Date(item.ai_started_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (now - startedAt) > fiveMinutes;
}

interface DebugRequestInfo {
  url: string;
  hasAuth: boolean;
  status: number | null;
  body: string | null;
  timestamp: string;
}

export function ItemDetail({ item, categories, isOpen, onClose, onUpdate, onDelete, onRefetch }: ItemDetailProps) {
  const { toast } = useToast();
  const [note, setNote] = useState(item?.user_note || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugRequest, setDebugRequest] = useState<DebugRequestInfo | null>(null);

  // Check for debug mode in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowDebug(params.get('debug') === '1');
  }, []);

  useEffect(() => { if (item) setNote(item.user_note || ''); }, [item]);

  if (!item) return null;

  const currentCategory = categories.find(c => c.id === item.category_id);
  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  const isStuck = isProcessingStuck(item);

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

  const handleReanalyze = async (mode: 'light' | 'deep' = 'light') => {
    setIsReanalyzing(true);
    setDebugRequest(null);
    
    // Build the endpoint URL for debug display
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpointUrl = `${supabaseUrl}/functions/v1/analyze-content`;
    
    try {
      console.log('[ItemDetail] Reanalyzing item:', item.id, 'mode:', mode);
      
      // Reset status first
      onUpdate?.(item.id, { ai_status: 'pending', ai_error: null });
      
      // Get session to check auth header
      const { data: sessionData } = await supabase.auth.getSession();
      const hasAuth = !!sessionData?.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: item.id, mode },
      });

      // Update debug info
      if (showDebug) {
        setDebugRequest({
          url: endpointUrl,
          hasAuth,
          status: error ? (error as any).status || 500 : 200,
          body: JSON.stringify(error || data, null, 2),
          timestamp: new Date().toLocaleString('ko-KR'),
        });
      }

      if (error) {
        console.error('[ItemDetail] Reanalysis error:', error);
        toast({
          title: '재분석 실패',
          description: error.message || '다시 시도해주세요.',
          variant: 'destructive',
        });
      } else if (data?.cached) {
        toast({
          title: '기존 분석 결과 사용',
          description: '동일 URL의 기존 분석이 적용되었습니다.',
        });
        onRefetch?.();
      } else {
        toast({
          title: mode === 'deep' ? 'AI 딥 분석 완료' : 'AI 분석 완료',
          description: '콘텐츠가 분석되었습니다.',
        });
        onRefetch?.();
      }
    } catch (e: any) {
      console.error('[ItemDetail] Reanalysis failed:', e);
      
      if (showDebug) {
        setDebugRequest({
          url: endpointUrl,
          hasAuth: false,
          status: null,
          body: e.message || String(e),
          timestamp: new Date().toLocaleString('ko-KR'),
        });
      }
      
      toast({
        title: '재분석 실패',
        description: e.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const renderDebugInfo = () => {
    if (!showDebug) return null;
    
    return (
      <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
        <div className="flex items-center gap-1 font-semibold text-muted-foreground mb-2">
          <Bug className="h-3 w-3" />
          Debug Info
        </div>
        <p><span className="text-muted-foreground">ai_status:</span> <span className={item.ai_status === 'error' ? 'text-destructive' : item.ai_status === 'done' ? 'text-green-600' : 'text-yellow-600'}>{item.ai_status}</span></p>
        <p><span className="text-muted-foreground">ai_attempts:</span> {item.ai_attempts || 0}</p>
        <p><span className="text-muted-foreground">ai_started_at:</span> {item.ai_started_at ? new Date(item.ai_started_at).toLocaleString('ko-KR') : 'null'}</p>
        <p><span className="text-muted-foreground">ai_finished_at:</span> {item.ai_finished_at ? new Date(item.ai_finished_at).toLocaleString('ko-KR') : 'null'}</p>
        <p><span className="text-muted-foreground">analysis_mode:</span> {item.analysis_mode || 'light'}</p>
        <p><span className="text-muted-foreground">url_hash:</span> {item.url_hash || 'null'}</p>
        {item.ai_error && <p className="text-destructive"><span className="text-muted-foreground">ai_error:</span> {item.ai_error}</p>}
        {isStuck && <p className="text-orange-600 font-semibold">⚠️ Processing 5분 초과 (stuck)</p>}
        
        {/* Edge Function Request Debug */}
        {debugRequest && (
          <div className="mt-3 pt-3 border-t border-muted-foreground/20 space-y-1">
            <div className="font-semibold text-primary mb-1">🔗 Last Edge Function Call</div>
            <p><span className="text-muted-foreground">timestamp:</span> {debugRequest.timestamp}</p>
            <p className="break-all"><span className="text-muted-foreground">url:</span> {debugRequest.url}</p>
            <p><span className="text-muted-foreground">Authorization:</span> {debugRequest.hasAuth ? <span className="text-green-600">✓ Present</span> : <span className="text-destructive">✗ Missing</span>}</p>
            <p><span className="text-muted-foreground">status:</span> <span className={debugRequest.status === 200 ? 'text-green-600' : 'text-destructive'}>{debugRequest.status ?? 'N/A'}</span></p>
            <div>
              <span className="text-muted-foreground">response:</span>
              <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                {debugRequest.body}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    const status = item.ai_status || 'pending';
    
    // Check for stuck processing
    if (isStuck) {
      return (
        <div className="bg-orange-500/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            분석 시간 초과
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            5분 이상 처리 중입니다. 재시도해주세요.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleReanalyze('light')}
            disabled={isReanalyzing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            다시 시도
          </Button>
        </div>
      );
    }
    
    // PENDING: Show "waiting" with "Analyze Now" button
    if (status === 'pending' && !isReanalyzing) {
      return (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            ⏳ 분석 대기중
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            AI 분석이 아직 시작되지 않았습니다.
          </p>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleReanalyze('light')}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            지금 분석하기
          </Button>
        </div>
      );
    }
    
    // PROCESSING: Show loading spinner
    if (status === 'processing' || isReanalyzing) {
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
            onClick={() => handleReanalyze('light')}
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
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleReanalyze('light')}
              disabled={isReanalyzing}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              라이트 분석
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleReanalyze('deep')}
              disabled={isReanalyzing}
            >
              딥 분석
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">✨ AI 3줄 요약</h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2"
              onClick={() => handleReanalyze('light')}
              disabled={isReanalyzing}
              title="라이트 재분석"
            >
              <RefreshCw className={`h-3 w-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={() => handleReanalyze('deep')}
              disabled={isReanalyzing}
              title="딥 분석"
            >
              딥
            </Button>
          </div>
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
            {item.analysis_mode === 'deep' ? '딥' : '라이트'} 분석 • 신뢰도: {Math.round((item.ai_confidence || 0) * 100)}%
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
          
          {renderDebugInfo()}
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
