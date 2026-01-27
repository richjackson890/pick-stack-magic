import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { cn } from '@/lib/utils';

interface ListViewItemProps {
  item: DbItem;
  category?: DbCategory;
  onClick: () => void;
}

export function ListViewItem({ item, category, onClick }: ListViewItemProps) {
  return (
    <article onClick={onClick} className={cn('flex gap-2.5 p-2.5 bg-card rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]')}>
      <div className="relative shrink-0">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-14 h-14 object-cover rounded-md" loading="lazy" />
        ) : (
          <div className="w-14 h-14 rounded-md flex items-center justify-center" style={{ backgroundColor: category?.color || '#6b7280' }}>
            <PlatformIcon platform={item.platform} size="md" />
          </div>
        )}
        <div className="absolute -bottom-1 -right-1">
          <PlatformIcon platform={item.platform} size="sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ backgroundColor: category?.color || '#6b7280' }}>
            {category?.icon && <span>{category.icon}</span>}
            {category?.name || '기타'}
          </span>
        </div>
        <h3 className="text-xs font-semibold text-foreground line-clamp-1">{item.title}</h3>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{item.summary_3lines[0]}</p>
      </div>
    </article>
  );
}
