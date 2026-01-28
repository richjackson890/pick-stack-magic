import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassChipProps {
  children: ReactNode;
  selected?: boolean;
  color?: string;
  icon?: ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function GlassChip({ 
  children, 
  selected, 
  color, 
  icon, 
  onClick, 
  size = 'md',
  className 
}: GlassChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-2xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'glass-chip flex items-center font-medium transition-all',
        sizeClasses[size],
        selected && 'ring-1 ring-primary/50',
        className
      )}
      style={{
        backgroundColor: selected 
          ? color 
            ? `${color}dd` 
            : 'hsl(var(--primary) / 0.9)'
          : color 
            ? `${color}33` 
            : 'hsl(var(--muted) / 0.5)',
        color: selected ? 'white' : color ? 'currentColor' : 'hsl(var(--foreground))',
        boxShadow: selected 
          ? `0 0 15px ${color || 'hsl(var(--primary))'}40`
          : 'none',
      }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
}

interface GlassChipGroupProps {
  children: ReactNode;
  className?: string;
}

export function GlassChipGroup({ children, className }: GlassChipGroupProps) {
  return (
    <div className={cn(
      'flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1',
      className
    )}>
      {children}
    </div>
  );
}
