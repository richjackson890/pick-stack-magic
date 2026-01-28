import { useMemo, useState } from 'react';
import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TextThumbnailCard, isForceTextThumb, fallbackKeywords } from '@/components/PickStackThumbs';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface SavedItemCardProps {
  item: DbItem;
  category?: DbCategory;
  onClick: () => void;
  isMasonry?: boolean;
}

export function SavedItemCard({ item, category, onClick, isMasonry = false }: SavedItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const isAnalyzing = item.ai_status === 'pending' || item.ai_status === 'processing';
  const isAiGenerated = item.thumbnail_url?.includes('/covers/');

  // 인스타/쓰레드는 무조건 텍스트 썸네일 사용
  const forceTextThumbnail = useMemo(() => {
    return isForceTextThumb(item.url) || isForceTextThumb(item.thumbnail_url);
  }, [item.url, item.thumbnail_url]);

  const hasThumbnail = !!item.thumbnail_url && !imgError && !forceTextThumbnail;
  
  const keywords = useMemo(() => {
    return (item.tags?.length ? item.tags : fallbackKeywords(item.title)) as string[];
  }, [item.tags, item.title]);

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
          <>
            <img 
              src={item.thumbnail_url!} 
              alt={item.title} 
              className="w-full h-full object-cover" 
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {/* AI Generated badge */}
            {isAiGenerated && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                <Sparkles className="h-2 w-2" />
                AI
              </div>
            )}
            {/* Title overlay for items with thumbnails */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 pt-4 bg-gradient-to-t from-black/70 to-transparent">
              <h3 className="text-[10px] font-medium text-white line-clamp-1 pr-12">{item.title}</h3>
            </div>
          </>
        ) : (
          <TextThumbnailCard
            title={item.title}
            keywords={keywords}
            category={category?.name}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none" />
        
        {/* Platform icon & analyzing status */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <PlatformIcon platform={item.platform} size="sm" />
          {isAnalyzing && (
            <span className="flex items-center gap-0.5 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              분석중
            </span>
          )}
        </div>
        
        {/* Category badge */}
        <span 
          className="absolute bottom-1.5 right-1.5 text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5" 
          style={{ backgroundColor: category?.color || '#6b7280' }}
        >
          {category?.icon && <span>{category.icon}</span>}
          {category?.name || '기타'}
        </span>
      </div>
    </article>
  );
}
