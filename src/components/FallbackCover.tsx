import { PlatformIcon } from '@/components/PlatformIcon';
import { Platform } from '@/types/pickstack';
import { cn } from '@/lib/utils';

interface FallbackCoverProps {
  platform: Platform;
  title: string;
  summary?: string;
  tags?: string[];
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Category-specific gradient styles
const categoryGradients: Record<string, string> = {
  '건강': 'from-emerald-500/90 via-teal-600/80 to-cyan-700/90',
  '투자': 'from-blue-500/90 via-indigo-600/80 to-violet-700/90',
  '레시피': 'from-orange-400/90 via-amber-500/80 to-yellow-600/90',
  '건축 레퍼런스': 'from-purple-500/90 via-fuchsia-600/80 to-pink-700/90',
  '렌더링/툴': 'from-pink-500/90 via-rose-600/80 to-red-700/90',
  '기타': 'from-slate-500/90 via-gray-600/80 to-zinc-700/90',
};

// Platform-specific accent colors
const platformAccents: Record<string, string> = {
  Instagram: 'from-pink-500 to-purple-600',
  YouTube: 'from-red-500 to-red-700',
  TikTok: 'from-cyan-400 to-pink-500',
  Threads: 'from-gray-700 to-black',
  Facebook: 'from-blue-500 to-blue-700',
  X: 'from-gray-800 to-black',
  Pinterest: 'from-red-600 to-red-800',
  Reddit: 'from-orange-500 to-orange-700',
  LinkedIn: 'from-blue-600 to-blue-800',
  Medium: 'from-gray-700 to-gray-900',
  Naver: 'from-green-500 to-green-700',
  Daum: 'from-blue-400 to-blue-600',
  Web: 'from-slate-500 to-slate-700',
  Unknown: 'from-gray-500 to-gray-700',
};

export function FallbackCover({
  platform,
  title,
  summary,
  tags = [],
  categoryName = '기타',
  categoryColor,
  categoryIcon,
  size = 'md',
  className,
}: FallbackCoverProps) {
  const gradient = categoryGradients[categoryName] || categoryGradients['기타'];
  const platformAccent = platformAccents[platform] || platformAccents['Unknown'];
  
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const titleSizes = {
    sm: 'text-[9px] line-clamp-2',
    md: 'text-[11px] line-clamp-2',
    lg: 'text-sm line-clamp-2',
  };

  const summarySizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-xs',
  };

  // Truncate title to max 12 words
  const truncatedTitle = title.split(' ').slice(0, 12).join(' ');
  
  // Get first 3 tags
  const displayTags = tags.slice(0, 3);

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col justify-between relative overflow-hidden',
        `bg-gradient-to-br ${gradient}`,
        sizeClasses[size],
        className
      )}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glass card overlay */}
      <div className="absolute inset-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top: Platform badge */}
        <div className="flex items-center justify-between">
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r',
            platformAccent,
            'shadow-md'
          )}>
            <PlatformIcon platform={platform} size="xs" className="text-white" />
          </div>
          
          {categoryIcon && (
            <span className="text-white/80 text-xs">{categoryIcon}</span>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 flex items-center justify-center px-1">
          <h3 className={cn(
            'font-semibold text-white text-center leading-tight drop-shadow-md',
            titleSizes[size]
          )}>
            {truncatedTitle}
          </h3>
        </div>

        {/* Bottom: Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {displayTags.map((tag, idx) => (
              <span
                key={idx}
                className={cn(
                  'px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 font-medium',
                  summarySizes[size]
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI badge indicator */}
      <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-bold bg-white/30 backdrop-blur-sm text-white">
        AI
      </div>
    </div>
  );
}
