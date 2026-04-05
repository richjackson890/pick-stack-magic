import { useState, useEffect, useRef, type ReactNode } from 'react';

interface GuideTooltipProps {
  name: string;
  message: string;
  position?: 'top' | 'bottom';
  children: ReactNode;
}

const STORAGE_PREFIX = 'tooltip_seen_';

export function GuideTooltip({ name, message, position = 'top', children }: GuideTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}${name}`) === '1';
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, '1');
  };

  const handleInteraction = () => {
    if (dismissed) return;
    setVisible(true);
    timeoutRef.current = setTimeout(dismiss, 4000);
  };

  if (dismissed) return <>{children}</>;

  const isTop = position === 'top';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleInteraction}
      onClick={handleInteraction}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 w-52 px-3 py-2 rounded-lg text-[11px] leading-relaxed font-medium text-white shadow-lg pointer-events-none ${
            isTop ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          {message}
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
              isTop
                ? 'top-full border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange-500'
                : 'bottom-full border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-orange-500'
            }`}
          />
        </div>
      )}
    </div>
  );
}
