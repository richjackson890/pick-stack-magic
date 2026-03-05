import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AdBannerProps {
  slot: 'top' | 'bottom' | 'feed';
  isPremium?: boolean;
  className?: string;
  onUpgrade?: () => void;
}

/**
 * AdBanner component for displaying ads
 * In production, replace the placeholder with actual ad network code (e.g., Google AdSense)
 * 
 * To integrate Google AdSense:
 * 1. Add the AdSense script to index.html
 * 2. Replace the placeholder content with the ad unit code
 */
export function AdBanner({ slot, isPremium = false, className = '', onUpgrade }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  // Don't show ads for premium users
  if (isPremium || dismissed) {
    return null;
  }

  // Different sizes based on slot
  const getAdStyles = () => {
    switch (slot) {
      case 'top':
        return 'h-[60px] sm:h-[90px]';
      case 'bottom':
        return 'h-[50px] sm:h-[60px]';
      case 'feed':
        return 'h-[120px] sm:h-[100px]';
      default:
        return 'h-[60px]';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: slot === 'top' ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: slot === 'top' ? -20 : 20 }}
        className={`relative w-full ${className}`}
      >
        <div
          ref={adRef}
          className={`
            glass rounded-lg flex items-center justify-center overflow-hidden
            ${getAdStyles()}
          `}
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--muted)/0.3), hsl(var(--muted)/0.1))',
            border: '1px solid hsl(var(--border)/0.3)'
          }}
        >
          {/* Placeholder - Replace with actual ad code */}
          <div className="flex items-center justify-center gap-3 text-muted-foreground/60">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-medium">광고</span>
              <span className="text-[10px]">Ad Space</span>
            </div>
            {slot === 'feed' && (
              <span className="text-[10px] text-amber-500/70 border border-amber-500/30 rounded-full px-2 py-0.5 cursor-pointer hover:bg-amber-500/10 transition-colors">
                ✨ 광고 없이 사용하기
              </span>
            )}
          </div>

          {/* Dismiss button for feed ads */}
          {slot === 'feed' && (
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-1 right-1 p-1 rounded-full glass-button hover:bg-muted/50 transition-colors"
              aria-label="광고 닫기"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Ad label */}
        <div className="absolute top-0 left-2 -translate-y-1/2">
          <span className="text-[8px] text-muted-foreground/50 bg-background px-1 rounded">
            AD
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
