import { SavedItem, PLATFORM_COLORS, CATEGORY_COLORS } from '@/types/pickstack';
import { cn } from '@/lib/utils';

interface SavedItemCardProps {
  item: SavedItem;
  onClick: () => void;
  isMasonry?: boolean;
}

export function SavedItemCard({ item, onClick, isMasonry = false }: SavedItemCardProps) {
  const hasThumbnail = !!item.thumbnail_url;

  return (
    <article
      onClick={onClick}
      className={cn(
        'group cursor-pointer relative',
        'bg-card rounded-lg overflow-hidden',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02]',
        isMasonry && 'masonry-item'
      )}
    >
      {/* Square Thumbnail Container */}
      <div className={cn(
        'relative overflow-hidden',
        isMasonry ? 'aspect-auto' : 'aspect-square'
      )}>
        {hasThumbnail ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex flex-col items-center justify-center',
              PLATFORM_COLORS[item.platform]
            )}
          >
            <span className="text-2xl sm:text-3xl text-white/90 font-bold">
              {item.platform.charAt(0)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/70 mt-1 px-2 text-center line-clamp-2">
              {item.title}
            </span>
          </div>
        )}

        {/* Overlay gradient for badges visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Platform Badge - Top Left */}
        <span
          className={cn(
            'absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-medium text-white px-1.5 py-0.5 rounded-full',
            PLATFORM_COLORS[item.platform]
          )}
        >
          {item.platform}
        </span>

        {/* Category Tag - Bottom Right */}
        <span
          className={cn(
            'absolute bottom-1.5 right-1.5 text-[8px] sm:text-[9px] font-medium text-white px-1.5 py-0.5 rounded-full',
            CATEGORY_COLORS[item.category]
          )}
        >
          {item.category}
        </span>

        {/* Title Overlay - Bottom */}
        {hasThumbnail && (
          <div className="absolute bottom-0 left-0 right-0 p-1.5 pt-4 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-[10px] sm:text-xs font-medium text-white line-clamp-1 pr-12">
              {item.title}
            </h3>
          </div>
        )}
      </div>
    </article>
  );
}
