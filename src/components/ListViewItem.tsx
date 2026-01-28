import { motion } from 'framer-motion';
import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ListViewItemProps {
  item: DbItem;
  category?: DbCategory;
  onClick: () => void;
}

export function ListViewItem({ item, category, onClick }: ListViewItemProps) {
  const hasThumbnail = !!item.thumbnail_url;
  const isAnalyzing = item.ai_status === 'pending' || item.ai_status === 'processing';

  return (
    <motion.article
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="glass-card cursor-pointer p-3 flex gap-3 items-center"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
        {hasThumbnail ? (
          <img 
            src={item.thumbnail_url!} 
            alt={item.title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: category?.color || '#6b7280' }}
          >
            <PlatformIcon platform={item.platform} size="md" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PlatformIcon platform={item.platform} size="sm" className="shrink-0" />
          {isAnalyzing && (
            <span className="glass-chip flex items-center gap-1 px-2 py-0.5">
              <Loader2 className="h-2.5 w-2.5 animate-spin text-neon-cyan" />
              <span className="text-2xs font-medium text-foreground/80">분석중</span>
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
          {item.title}
        </h3>
        <div className="flex items-center gap-2">
          <span 
            className="text-2xs font-medium px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${category?.color}33` || 'hsl(var(--muted))',
              color: category?.color || 'hsl(var(--foreground))'
            }}
          >
            {category?.icon} {category?.name || '기타'}
          </span>
          {item.summary_3lines[0] && (
            <span className="text-2xs text-muted-foreground line-clamp-1 flex-1">
              {item.summary_3lines[0]}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
