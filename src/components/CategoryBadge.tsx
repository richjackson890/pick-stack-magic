import { DbCategory } from '@/hooks/useDbCategories';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category?: DbCategory;
  size?: 'sm' | 'md';
  onClick?: () => void;
  selected?: boolean;
  showIcon?: boolean;
}

export function CategoryBadge({ 
  category, 
  size = 'sm', 
  onClick, 
  selected,
  showIcon = false 
}: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const displayColor = category?.color || '#6b7280';
  const displayName = category?.name || '기타';
  const displayIcon = category?.icon;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center font-medium text-white rounded-full transition-all',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-90 hover:scale-105',
        selected && 'ring-2 ring-offset-2 ring-foreground/20',
        !onClick && 'cursor-default'
      )}
      style={{ backgroundColor: displayColor }}
    >
      {showIcon && displayIcon && (
        <span className="text-[0.8em]">{displayIcon}</span>
      )}
      {displayName}
    </button>
  );
}

// Chip version for filter bar - works with DbCategory
interface CategoryChipProps {
  category: DbCategory | { id: string; name: string; color: string; icon?: string | null };
  selected?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ category, selected, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
        selected
          ? 'text-white shadow-md'
          : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
      )}
      style={selected ? { backgroundColor: category.color } : undefined}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </button>
  );
}
