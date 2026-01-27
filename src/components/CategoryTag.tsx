import { Category, CATEGORY_COLORS } from '@/types/pickstack';
import { cn } from '@/lib/utils';

interface CategoryTagProps {
  category: Category;
  size?: 'sm' | 'md';
  onClick?: () => void;
  selected?: boolean;
}

export function CategoryTag({ category, size = 'sm', onClick, selected }: CategoryTagProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center font-medium text-white rounded-full transition-all',
        CATEGORY_COLORS[category],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-90 hover:scale-105',
        selected && 'ring-2 ring-offset-2 ring-foreground/20'
      )}
    >
      {category}
    </button>
  );
}
