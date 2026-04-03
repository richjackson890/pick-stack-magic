import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'onboarding_complete';

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'DLab Archi Tips에 오신 걸 환영합니다',
    description:
      '건축 설계 실무에서 쌓은 지식과 노하우를 팀과 함께 공유하는 플랫폼입니다. 유용한 팁을 저장하고, 동료들의 인사이트를 한눈에 확인해보세요.',
  },
  {
    emoji: '📖',
    title: '팁 둘러보기',
    description:
      '좌측 피드에서 카테고리와 태그로 필터링하고, 마음에 드는 팁에 좋아요와 북마크를 눌러 나만의 컬렉션을 만들어보세요.',
  },
  {
    emoji: '✍️',
    title: '팁 등록하기',
    description:
      'Share a Tip 버튼을 눌러 URL이나 이미지를 붙여넣으면, AI가 자동으로 제목·내용·태그를 분석해줍니다. 간편하게 지식을 공유하세요.',
  },
  {
    emoji: '📊',
    title: '업무 현황판',
    description:
      '우측 대시보드에서 프로젝트 현황, 팀 일정, 휴가 관리까지 한 곳에서 확인할 수 있습니다.',
  },
  {
    emoji: '👥',
    title: '팀 초대',
    description:
      '팀 관리 메뉴에서 초대 링크를 생성하고 동료에게 공유하면, 바로 팀에 합류할 수 있습니다.',
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== 'true') {
      setOpen(true);
    }
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setStep(0);
  }, []);

  const reopen = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStep(0);
    setOpen(true);
  }, []);

  const prev = () => setStep((s) => Math.max(0, s - 1));
  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  };

  const current = STEPS[step];

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          >
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md mx-4 rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
            >
              {/* Skip button */}
              <button
                onClick={complete}
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                aria-label="Skip onboarding"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="px-6 pt-10 pb-6 text-center">
                <div className="text-5xl mb-4">{current.emoji}</div>
                <h2 className="text-lg font-bold mb-2">{current.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center justify-between">
                {/* Prev */}
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium transition-colors',
                    step === 0
                      ? 'text-transparent pointer-events-none'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </button>

                {/* Dots */}
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        i === step
                          ? 'w-5 bg-orange-500'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      )}
                      aria-label={`Step ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Next / Complete */}
                <button
                  onClick={next}
                  className="flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {step === STEPS.length - 1 ? '시작하기' : '다음'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help FAB */}
      <button
        onClick={reopen}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Reopen onboarding"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </>
  );
}
