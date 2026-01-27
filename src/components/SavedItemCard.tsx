import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { cn } from '@/lib/utils';

interface SavedItemCardProps {
  item: DbItem;
  category?: DbCategory;
  onClick: () => void;
  isMasonry?: boolean;
}

export function SavedItemCard({ item, category, onClick, isMasonry = false }: SavedItemCardProps) {
  const hasThumbnail = !!item.thumbnail_url;

  return (
    <article
      onClick={onClick}
      className={cn(
        'group cursor-pointer relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]',
        isMasonry && 'masonry-item'
      )}
    >
      <div className={cn('relative overflow-hidden', isMasonry ? 'aspect-auto' : 'aspect-square')}>
        {hasThumbnail ? (
          <img src={item.thumbnail_url!} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2" style={{ backgroundColor: category?.color || '#6b7280' }}>
            <PlatformIcon platform={item.platform} size="lg" className="mb-1" />
            <span className="text-[9px] text-white/80 text-center line-clamp-2">{item.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <div className="absolute top-1.5 left-1.5">
          <PlatformIcon platform={item.platform} size="sm" />
        </div>
        <span className="absolute bottom-1.5 right-1.5 text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ backgroundColor: category?.color || '#6b7280' }}>
          {category?.icon && <span>{category.icon}</span>}
          {category?.name || '기타'}
        </span>
        {hasThumbnail && (
          <div className="absolute bottom-0 left-0 right-0 p-1.5 pt-4 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-[10px] font-medium text-white line-clamp-1 pr-12">{item.title}</h3>
          </div>
        )}
      </div>
    </article>
  );
}
