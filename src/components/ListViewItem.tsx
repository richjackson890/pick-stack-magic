import { SavedItem, PLATFORM_COLORS } from '@/types/pickstack';
import { PlatformBadge } from './PlatformBadge';
import { CategoryTag } from './CategoryTag';
import { cn } from '@/lib/utils';

interface ListViewItemProps {
  item: SavedItem;
  onClick: () => void;
}

export function ListViewItem({ item, onClick }: ListViewItemProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'flex gap-3 p-3 bg-card rounded-lg cursor-pointer',
        'shadow-card hover:shadow-card-hover',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5'
      )}
    >
      {/* Thumbnail */}
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className="w-20 h-20 object-cover rounded-lg shrink-0"
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'w-20 h-20 rounded-lg shrink-0 flex items-center justify-center',
            PLATFORM_COLORS[item.platform]
          )}
        >
          <span className="text-2xl text-white/90 font-bold">
            {item.platform.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={item.platform} />
          <CategoryTag category={item.category} />
        </div>
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.summary_3lines[0]}
        </p>
      </div>
    </article>
  );
}
