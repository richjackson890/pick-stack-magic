import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

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
  const [alignRight, setAlignRight] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, dismiss]);

  // Check if tooltip overflows right edge
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      setAlignRight(true);
    } else if (rect.left < 8) {
      setAlignRight(false);
    }
  }, [visible]);

  const showTooltip = () => {
    if (dismissed) return;
    setAlignRight(false);
    setVisible(true);
  };

  if (dismissed) return <>{children}</>;

  const isTop = position === 'top';
  const posClass = isTop ? 'bottom-full mb-3' : 'top-full mt-3';
  const alignClass = alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex overflow-visible"
      style={{ overflow: 'visible' }}
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

      {visible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-60 px-4 py-3 rounded-xl text-xs leading-relaxed font-medium text-white shadow-2xl ${posClass} ${alignClass}`}
          style={{
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
            className={`absolute ${alignRight ? 'right-4' : 'left-1/2 -translate-x-1/2'} w-0 h-0 ${
              isTop
                ? 'top-full border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-orange-500'
                : 'bottom-full border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-orange-500'
            }`}
          />
        </div>
      )}
    </div>
  );
}
