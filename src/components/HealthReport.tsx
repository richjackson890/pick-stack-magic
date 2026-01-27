import { Button } from '@/components/ui/button';
import { Activity, Calendar, ChevronRight } from 'lucide-react';

interface HealthReportProps {
  onClose: () => void;
}

export function HealthReport({ onClose }: HealthReportProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-category-health" />
            건강 리포트
          </h1>
          <button onClick={onClose} className="text-sm text-muted-foreground">
            닫기
          </button>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Report Buttons */}
        <div className="grid gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 justify-between bg-gradient-to-r from-category-health/10 to-transparent border-category-health/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-category-health/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-category-health" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">최근 7일 건강 저장물 종합</p>
                <p className="text-xs text-muted-foreground">저장한 건강 콘텐츠를 분석합니다</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 justify-between bg-gradient-to-r from-primary/10 to-transparent border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">오늘의 루틴 만들기</p>
                <p className="text-xs text-muted-foreground">AI가 맞춤 루틴을 추천합니다</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Placeholder Report */}
        <div className="bg-card rounded-lg p-6 shadow-card space-y-6">
          <h2 className="font-bold text-foreground">📊 리포트 미리보기</h2>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🕐 시간표
            </h3>
            <div className="grid gap-2">
              {[
                { time: '아침', items: ['공복 레몬수', '스트레칭 10분'] },
                { time: '점심', items: ['단백질 위주 식사', '식후 산책'] },
                { time: '저녁', items: ['가벼운 저녁', '요가 20분'] },
                { time: '취침 전', items: ['마그네슘 섭취', '디지털 디톡스'] },
              ].map((schedule) => (
                <div
                  key={schedule.time}
                  className="flex items-start gap-3 bg-secondary/50 rounded-lg p-3"
                >
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {schedule.time}
                  </span>
                  <ul className="flex-1 space-y-1">
                    {schedule.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-foreground/80">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              ✅ 오늘의 체크리스트
            </h3>
            <div className="space-y-2">
              {[
                '물 2L 마시기',
                '계단 이용하기',
                '하체 운동 20분',
                '비타민D 섭취',
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-border"
                  />
                  <span className="text-sm text-foreground">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              📝 한 장 요약
            </h3>
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-primary mb-1">결론</p>
                <p className="text-sm text-foreground/90">
                  최근 저장한 콘텐츠를 분석한 결과, 하체 운동과 영양제 섭취에 관심이 많으신 것 같습니다.
                  일관된 루틴 유지가 핵심입니다.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-accent mb-1">⚠️ 의견 갈림</p>
                <p className="text-sm text-foreground/90">
                  공복 운동의 효과에 대해서는 전문가들 사이에서도 의견이 갈립니다.
                  개인의 컨디션에 맞게 조절하세요.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-destructive mb-1">주의사항</p>
                <p className="text-sm text-foreground/90">
                  영양제 과다 섭취에 주의하세요. 의사와 상담 후 복용을 권장합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          🔧 이 기능은 현재 개발 중입니다
        </p>
      </div>
    </div>
  );
}
