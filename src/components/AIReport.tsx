import { useState, useMemo } from 'react';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
  Palette,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'all';

interface AIReportProps {
  items: DbItem[];
  categories: DbCategory[];
  onClose: () => void;
  onRetryAnalysis: (itemId: string) => void;
  onBatchAnalyze: () => void;
  isProcessing: boolean;
}

export function AIReport({ 
  items, 
  categories, 
  onClose, 
  onRetryAnalysis, 
  onBatchAnalyze,
  isProcessing 
}: AIReportProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { usageData } = useUsageLimits();

  // Filter items by date range
  const filteredItems = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      switch (dateRange) {
        case 'today':
          return itemDate >= startOfToday;
        case 'week':
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return itemDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(startOfToday);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [items, dateRange]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, DbItem[]> = {};
    filteredItems.forEach(item => {
      const catId = item.category_id || 'uncategorized';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(item);
    });
    return grouped;
  }, [filteredItems]);

  // Pending/Failed items
  const pendingItems = useMemo(() => 
    items.filter(i => i.ai_status === 'pending'), [items]);
  const failedItems = useMemo(() => 
    items.filter(i => i.ai_status === 'error'), [items]);
  const processingItems = useMemo(() => 
    items.filter(i => i.ai_status === 'processing'), [items]);

  // Generate daily briefing
  const dailyBriefing = useMemo(() => {
    if (filteredItems.length === 0) return '저장된 콘텐츠가 없습니다.';
    const count = filteredItems.length;
    const topCategory = Object.entries(itemsByCategory)
      .sort((a, b) => b[1].length - a[1].length)[0];
    const categoryName = categories.find(c => c.id === topCategory?.[0])?.name || '기타';
    
    if (dateRange === 'today') {
      return `오늘 ${count}개의 콘텐츠를 저장했어요. ${categoryName} 관련 콘텐츠가 많네요!`;
    }
    return `이번 ${dateRange === 'week' ? '주' : '한 달'}간 ${count}개의 콘텐츠 중 ${categoryName}에 가장 관심이 많았어요.`;
  }, [filteredItems, itemsByCategory, categories, dateRange]);

  // Get category icon by name
  const getCategoryIcon = (name: string) => {
    if (name.includes('건강')) return <Activity className="h-4 w-4" />;
    if (name.includes('투자')) return <TrendingUp className="h-4 w-4" />;
    if (name.includes('렌더링') || name.includes('툴')) return <Palette className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  // Extract top keywords from items in a category
  const getTopKeywords = (categoryItems: DbItem[]) => {
    const tagCounts: Record<string, number> = {};
    categoryItems.forEach(item => {
      item.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  };

  // Generate category summary
  const getCategorySummary = (categoryItems: DbItem[]) => {
    const summaries = categoryItems
      .filter(i => i.summary_3lines?.length > 0)
      .flatMap(i => i.summary_3lines)
      .filter(Boolean)
      .slice(0, 3);
    return summaries.length > 0 ? summaries : ['아직 분석된 콘텐츠가 없습니다.'];
  };

  const selectedCategory = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId) 
    : null;
  const selectedCategoryItems = selectedCategoryId 
    ? itemsByCategory[selectedCategoryId] || [] 
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 리포트
          </h1>
          <button onClick={onClose} className="text-sm text-muted-foreground">
            닫기
          </button>
        </div>
      </header>

      <div className="container py-4 space-y-5">
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {[
            { key: 'today', label: '오늘' },
            { key: 'week', label: '이번주' },
            { key: 'month', label: '최근 30일' },
            { key: 'all', label: '전체' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateRange(key as DateRange)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                dateRange === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Daily Briefing */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">오늘의 한줄 브리핑</p>
              <p className="text-sm font-medium text-foreground">{dailyBriefing}</p>
            </div>
          </div>
        </Card>

        {/* Category Briefing Cards - Horizontal Scroll */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            카테고리별 브리핑
          </h2>
          
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {categories.map(category => {
                const categoryItems = itemsByCategory[category.id] || [];
                if (categoryItems.length === 0) return null;
                
                const keywords = getTopKeywords(categoryItems);
                const summaries = getCategorySummary(categoryItems);
                
                return (
                  <Card
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      'w-[260px] p-4 shrink-0 cursor-pointer transition-all hover:shadow-md',
                      selectedCategoryId === category.id && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon || getCategoryIcon(category.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{categoryItems.length}개 저장</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 whitespace-normal">
                      {summaries.slice(0, 2).map((summary, idx) => (
                        <p key={idx} className="text-xs text-foreground/80 line-clamp-2">
                          • {summary}
                        </p>
                      ))}
                    </div>
                    
                    {keywords.length > 0 && (
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {keywords.map(kw => (
                          <span 
                            key={kw}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Selected Category Detail - Health Routine */}
        {selectedCategory && selectedCategory.name.includes('건강') && selectedCategoryItems.length > 0 && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                하루 루틴 생성
              </h3>
              <span className="text-xs text-muted-foreground">저장한 건강 콘텐츠 기반</span>
            </div>
            
            <div className="space-y-3">
              {[
                { time: '아침 (기상 후)', items: ['공복 레몬수 또는 따뜻한 물', '가벼운 스트레칭 10분'], warning: '영양제는 식후 복용 권장' },
                { time: '점심 전/후', items: ['단백질 위주 식사', '식후 15분 산책'], warning: null },
                { time: '운동 전/후', items: ['운동 30분 전 가벼운 탄수화물', '운동 후 단백질 보충'], warning: '공복 운동 시 저혈당 주의' },
                { time: '저녁', items: ['가볍게 식사', '과일/채소 섭취'], warning: null },
                { time: '취침 전', items: ['마그네슘 섭취', '스마트폰 사용 자제'], warning: '카페인 저녁 이후 섭취 금지' },
              ].map((schedule, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-20 shrink-0">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {schedule.time}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    {schedule.items.map((item, i) => (
                      <p key={i} className="text-sm text-foreground/90">• {item}</p>
                    ))}
                    {schedule.warning && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {schedule.warning}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" size="sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              내 루틴으로 저장
            </Button>
          </Card>
        )}

        {/* Selected Category Detail - Investment */}
        {selectedCategory && selectedCategory.name.includes('투자') && selectedCategoryItems.length > 0 && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              이번주 체크포인트
            </h3>
            
            <div className="space-y-2">
              {['시장 변동성 모니터링', '포트폴리오 리밸런싱 검토', '경제 지표 발표 일정 확인'].map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-foreground">{point}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                리스크 경고: 투자 정보는 참고용이며, 실제 투자 결정은 본인 판단에 따라 신중히 진행하세요.
              </p>
            </div>
          </Card>
        )}

        {/* Selected Category Detail - Rendering/Tools */}
        {selectedCategory && (selectedCategory.name.includes('렌더링') || selectedCategory.name.includes('툴')) && selectedCategoryItems.length > 0 && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-500" />
              툴팁 & 세팅 요약
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">핵심 세팅 5개</p>
                <ul className="space-y-1 text-sm">
                  <li>• PBR 텍스처 적용으로 사실감 향상</li>
                  <li>• 조명 강도 및 색온도 조절</li>
                  <li>• 앰비언트 오클루전 활성화</li>
                  <li>• 반사 품질 설정</li>
                  <li>• 후처리 효과 적용</li>
                </ul>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">작업 순서</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-secondary rounded">1. 모델링</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="px-2 py-1 bg-secondary rounded">2. 재질/조명</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="px-2 py-1 bg-secondary rounded">3. 렌더링</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Analysis Management Section */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            분석 관리
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-600">{pendingItems.length}</p>
              <p className="text-xs text-muted-foreground">대기중</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600">{processingItems.length}</p>
              <p className="text-xs text-muted-foreground">분석중</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-600">{failedItems.length}</p>
              <p className="text-xs text-muted-foreground">실패</p>
            </div>
          </div>

          {(pendingItems.length > 0 || failedItems.length > 0) && (
            <Button 
              onClick={onBatchAnalyze}
              disabled={isProcessing}
              className="w-full"
              variant="outline"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  전체 재분석 ({pendingItems.length + failedItems.length}개)
                </>
              )}
            </Button>
          )}

          {failedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">실패한 항목:</p>
              {failedItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-destructive truncate">{item.ai_error || '분석 실패'}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onRetryAnalysis(item.id)}
                    className="shrink-0 ml-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          💡 카테고리를 선택하면 맞춤형 인사이트를 볼 수 있어요
        </p>
      </div>
    </div>
  );
}
