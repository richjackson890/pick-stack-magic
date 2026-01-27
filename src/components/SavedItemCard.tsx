import { SavedItem, PLATFORM_COLORS } from '@/types/pickstack';
import { PlatformBadge } from './PlatformBadge';
import { CategoryTag } from './CategoryTag';
import { cn } from '@/lib/utils';

interface SavedItemCardProps {
  item: SavedItem;
  onClick: () => void;
}

export function SavedItemCard({ item, onClick }: SavedItemCardProps) {
  const hasThumbnail = !!item.thumbnail_url;

  return (
    <article
      onClick={onClick}
      className={cn(
        'masonry-item group cursor-pointer',
        'bg-card rounded-lg overflow-hidden',
        'shadow-card hover:shadow-card-hover',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1'
      )}
    >
      {/* Thumbnail or Placeholder */}
      {hasThumbnail ? (
        <div className="relative overflow-hidden">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div
          className={cn(
            'w-full aspect-[4/3] flex items-center justify-center',
            PLATFORM_COLORS[item.platform]
          )}
        >
          <span className="text-4xl text-white/90 font-bold">
            {item.platform.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Platform Badge */}
        <div className="flex items-center gap-2">
          <PlatformBadge platform={item.platform} />
          <CategoryTag category={item.category} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {item.title}
        </h3>

        {/* Tags Preview */}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
