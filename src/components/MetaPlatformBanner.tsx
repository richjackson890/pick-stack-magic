import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MetaPlatformBannerProps {
  platform: 'Instagram' | 'Threads' | null;
  className?: string;
}

const STORAGE_KEY_SHOWN = 'meta_guide_shown';
const STORAGE_KEY_DISMISSED = 'meta_guide_dismissed';

export function MetaPlatformBanner({ platform, className }: MetaPlatformBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!platform) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed the banner permanently
    const isDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // Check if this is first visit for this platform
    const shownBefore = localStorage.getItem(STORAGE_KEY_SHOWN);
    const isFirst = !shownBefore;
    setIsFirstVisit(isFirst);
    setIsVisible(true);

    // Mark as shown
    if (!shownBefore) {
      localStorage.setItem(STORAGE_KEY_SHOWN, 'true');
    }
  }, [platform]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !platform) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative rounded-xl p-4 space-y-3',
          'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40',
          isFirstVisit && 'ring-2 ring-purple-300 dark:ring-purple-600 shadow-lg',
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Info className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              💡 스크린샷을 함께 첨부하면 더 정확해요!
            </h4>
          </div>
        </div>

        {/* Content */}
        <div className="text-xs text-muted-foreground leading-relaxed space-y-2 pl-11">
          <p>
            {platform}은(는) Meta의 개인정보 보호 정책으로 인해 게시물의 이미지와 내용을 자동으로 가져오기 어렵습니다.
          </p>
          <p>아래 📷 스크린샷 첨부 버튼으로 캡처 이미지를 추가하면:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="text-green-600 dark:text-green-400">✓</span>
              원본 그대로의 썸네일이 저장됩니다
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-green-600 dark:text-green-400">✓</span>
              AI가 이미지를 분석해 더 정확한 제목과 태그를 생성합니다
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-green-600 dark:text-green-400">✓</span>
              나중에 한눈에 찾아볼 수 있어요
            </li>
          </ul>
          <p className="text-purple-600 dark:text-purple-400 font-medium mt-2">
            💡 팁: 다음부터는 마음에 드는 게시물을 발견하면 공유하기 전에 스크린샷을 먼저 찍어두세요!
          </p>
        </div>

        {/* Don't show again checkbox */}
        <div className="flex items-center gap-2 pl-11">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dont-show-again"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            다시 보지 않기
          </label>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
