import { SavedItem, PLATFORM_COLORS, CATEGORY_COLORS } from '@/types/pickstack';
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
        'flex gap-2.5 p-2.5 bg-card rounded-lg cursor-pointer',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.01]'
      )}
    >
      {/* Thumbnail - Smaller */}
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className="w-14 h-14 object-cover rounded-md shrink-0"
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'w-14 h-14 rounded-md shrink-0 flex items-center justify-center',
            PLATFORM_COLORS[item.platform]
          )}
        >
          <span className="text-lg text-white/90 font-bold">
            {item.platform.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full',
              PLATFORM_COLORS[item.platform]
            )}
          >
            {item.platform}
          </span>
          <span
            className={cn(
              'text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full',
              CATEGORY_COLORS[item.category]
            )}
          >
            {item.category}
          </span>
        </div>
        <h3 className="text-xs font-semibold text-foreground line-clamp-1">
          {item.title}
        </h3>
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {item.summary_3lines[0]}
        </p>
      </div>
    </article>
  );
}
