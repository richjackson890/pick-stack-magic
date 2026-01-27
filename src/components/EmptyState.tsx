import { Bookmark, Share2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Hero Illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Bookmark className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">첫 번째 콘텐츠를 저장해보세요!</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">
        관심 있는 콘텐츠를 저장하면 AI가 자동으로 분류하고 요약해드려요
      </p>

      {/* How to use guide */}
      <div className="w-full max-w-sm mb-8 space-y-4">
        <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">1</span>
          </div>
          <div>
            <p className="font-medium text-sm">콘텐츠 공유하기</p>
            <p className="text-xs text-muted-foreground">
              Instagram, YouTube 등에서 공유 버튼을 누르고 PickStack 선택
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">2</span>
          </div>
          <div>
            <p className="font-medium text-sm">AI가 자동 분석</p>
            <p className="text-xs text-muted-foreground">
              제목, 카테고리, 3줄 요약을 자동으로 생성
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">3</span>
          </div>
          <div>
            <p className="font-medium text-sm">저장 완료!</p>
            <p className="text-xs text-muted-foreground">
              한 번의 탭으로 저장하고 언제든 다시 확인
            </p>
          </div>
        </div>
      </div>

      <Button onClick={onAddClick} size="lg" className="gap-2">
        <Share2 className="w-4 h-4" />
        직접 추가하기
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="mt-4 text-xs text-muted-foreground">
        또는 다른 앱에서 공유 → PickStack 선택
      </p>
    </div>
  );
}
