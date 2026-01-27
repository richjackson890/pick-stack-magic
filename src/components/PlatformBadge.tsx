import { Platform, PLATFORM_COLORS } from '@/types/pickstack';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
}

export function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium text-white rounded-full',
        PLATFORM_COLORS[platform],
        sizeClasses[size]
      )}
    >
      {platform}
    </span>
  );
}
