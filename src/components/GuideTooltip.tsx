import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface GuideTooltipProps {
  name: string;
  message: string;
  position?: 'top' | 'bottom';
  children: ReactNode;
}

const STORAGE_PREFIX = 'tooltip_seen_';

export function isTooltipSeen(name: string): boolean {
  return localStorage.getItem(`${STORAGE_PREFIX}${name}`) === '1';
}

export function GuideTooltip({ name, message, position = 'top', children }: GuideTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => isTooltipSeen(name));
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, '1');
  }, [name]);

  // Click outside to dismiss
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        tooltipRef.current && !tooltipRef.current.contains(target)
      ) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, dismiss]);

  // Calculate fixed position from trigger rect
  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const calcCoords = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const tooltipW = 240; // w-60 = 15rem = 240px
      const gap = 12;

      let top: number;
      if (position === 'top') {
        top = rect.top - gap;
      } else {
        top = rect.bottom + gap;
      }

      // Center horizontally on trigger, clamp to viewport
      let left = rect.left + rect.width / 2 - tooltipW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));

      setCoords({ top, left });
    };
    calcCoords();
    window.addEventListener('scroll', calcCoords, true);
    window.addEventListener('resize', calcCoords);
    return () => {
      window.removeEventListener('scroll', calcCoords, true);
      window.removeEventListener('resize', calcCoords);
    };
  }, [visible, position]);

  const showTooltip = () => {
    if (dismissed) return;
    setVisible(true);
  };

  if (dismissed) return <>{children}</>;

  const isTop = position === 'top';

  // Calculate arrow left offset relative to tooltip
  const getArrowLeft = () => {
    if (!triggerRef.current || !coords) return '50%';
    const rect = triggerRef.current.getBoundingClientRect();
    const triggerCenter = rect.left + rect.width / 2;
    const offset = triggerCenter - coords.left;
    return `${offset}px`;
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex"
        onMouseEnter={showTooltip}
        onClick={showTooltip}
      >
        {/* Pulsing beacon ring */}
        {!visible && (
          <span className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <span className="absolute w-full h-full rounded-full animate-ping bg-orange-400/40" />
            <span className="absolute w-full h-full rounded-full animate-pulse ring-2 ring-orange-400/60 bg-transparent" />
          </span>
        )}

        {children}
      </div>

      {visible && coords && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-60 px-4 py-3 rounded-xl text-xs leading-relaxed font-medium text-white shadow-2xl"
          style={{
            top: isTop ? undefined : coords.top,
            bottom: isTop ? `${window.innerHeight - coords.top}px` : undefined,
            left: coords.left,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
          }}
        >
          {/* Close X */}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="absolute top-1.5 right-2 text-white/70 hover:text-white text-sm leading-none"
          >
            &times;
          </button>

          <p className="pr-4">{message}</p>

          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="mt-2 w-full py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition-colors"
          >
            확인
          </button>

          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 ${
              isTop
                ? 'top-full border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-orange-500'
                : 'bottom-full border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-orange-500'
            }`}
            style={{ left: getArrowLeft(), transform: 'translateX(-50%)' }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
