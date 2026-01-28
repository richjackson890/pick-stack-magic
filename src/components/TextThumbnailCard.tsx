import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { FallbackCover } from '@/components/FallbackCover';
import { IconDisplay } from '@/components/IconPicker';
import { migrateIconKey } from '@/lib/iconRegistry';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, ExternalLink, AlertCircle, RefreshCw, Hash } from 'lucide-react';

interface TextThumbnailCardProps {
  item: DbItem & {
    fallback_title?: string;
    smart_snippet?: string;
    core_keywords?: string[];
    hashtags?: string[];
    entities?: string[];
  };
  category?: DbCategory;
  onClick: () => void;
  onRetryAnalysis?: () => void;
  highlightQuery?: string;
}

export function TextThumbnailCard({ 
  item, 
  category, 
  onClick, 
  onRetryAnalysis,
  highlightQuery 
}: TextThumbnailCardProps) {
  const hasThumbnail = !!item.thumbnail_url;
  const isAnalyzing = item.ai_status === 'pending' || item.ai_status === 'processing';
  const isAnalysisFailed = item.ai_status === 'error';
  const isAiGenerated = item.thumbnail_url?.includes('/covers/');

  // Get display text
  const displayTitle = item.title || item.fallback_title || 'Untitled';
  const displaySnippet = item.smart_snippet || item.summary_3lines?.[0] || '';
  const displayKeywords = [
    ...(item.core_keywords || []),
    ...(item.tags || []),
    ...(item.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`)
  ].slice(0, 5);

  // Highlight matching text
  const highlightText = (text: string): string => {
    if (!highlightQuery || !text) return text;
    const regex = new RegExp(`(${highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary/30 text-primary rounded px-0.5">$1</mark>');
  };

  // For items without thumbnail, show rich text card
  if (!hasThumbnail) {
    return (
      <article
        onClick={onClick}
        className={cn(
          'group cursor-pointer relative rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]',
          'bg-gradient-to-br p-3',
          isAnalysisFailed && 'ring-2 ring-destructive/30'
        )}
        style={{
          background: `linear-gradient(135deg, ${category?.color || '#6b7280'}15 0%, ${category?.color || '#6b7280'}08 100%)`,
        }}
      >
        {/* Platform & Category badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <PlatformIcon platform={item.platform} size="sm" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {item.platform}
            </span>
          </div>
          <span 
            className="text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5" 
            style={{ backgroundColor: category?.color || '#6b7280' }}
          >
            <IconDisplay iconKey={migrateIconKey(category?.icon || null)} size="sm" className="text-white/90" />
            {category?.name || '기타'}
          </span>
        </div>

        {/* Title */}
        <h3 
          className="font-semibold text-sm line-clamp-2 mb-1.5 text-foreground"
          dangerouslySetInnerHTML={{ __html: highlightText(displayTitle) }}
        />

        {/* Snippet/Summary */}
        <p 
          className="text-xs text-muted-foreground line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{ 
            __html: displaySnippet 
              ? highlightText(displaySnippet)
              : (isAnalyzing ? '분석 중...' : (isAnalysisFailed ? '분석 실패' : '요약 대기중'))
          }}
        />

        {/* Keywords */}
        {displayKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {displayKeywords.map((keyword, i) => (
              <span 
                key={i}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: highlightText(keyword) }}
              />
            ))}
            {(item.tags?.length || 0) > 5 && (
              <span className="text-[9px] px-1.5 py-0.5 text-muted-foreground">
                +{(item.tags?.length || 0) - 5}
              </span>
            )}
          </div>
        )}

        {/* Status indicators */}
        <div className="flex items-center justify-between">
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-[10px] text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              분석 중...
            </span>
          )}
          {isAnalysisFailed && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRetryAnalysis?.();
              }}
              className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80"
            >
              <AlertCircle className="h-3 w-3" />
              분석 실패
              <RefreshCw className="h-2.5 w-2.5 ml-0.5" />
            </button>
          )}
          {!isAnalyzing && !isAnalysisFailed && (
            <span className="text-[9px] text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
          
          {item.url && (
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 text-[9px] text-primary hover:underline"
            >
              원본
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {/* Glass overlay effect */}
        <div className="absolute inset-0 pointer-events-none rounded-lg border border-border/20" />
      </article>
    );
  }

  // For items WITH thumbnail, use original card style with enhancements
  return (
    <article
      onClick={onClick}
      className={cn(
        'group cursor-pointer relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]'
      )}
    >
      <div className="relative overflow-hidden aspect-square">
        <img 
          src={item.thumbnail_url!} 
          alt={displayTitle} 
          className="w-full h-full object-cover" 
          loading="lazy" 
        />
        
        {/* AI Generated badge */}
        {isAiGenerated && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
            <Sparkles className="h-2 w-2" />
            AI
          </div>
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
          {isAnalysisFailed && (
            <span className="flex items-center gap-0.5 bg-destructive/80 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              <AlertCircle className="h-2.5 w-2.5" />
              실패
            </span>
          )}
        </div>
        
        {/* Category badge */}
        <span 
          className="absolute bottom-1.5 right-1.5 text-[8px] font-medium text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5" 
          style={{ backgroundColor: category?.color || '#6b7280' }}
        >
          <IconDisplay iconKey={migrateIconKey(category?.icon || null)} size="sm" className="text-white/90" />
          {category?.name || '기타'}
        </span>
        
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 pt-4 bg-gradient-to-t from-black/70 to-transparent">
          <h3 
            className="text-[10px] font-medium text-white line-clamp-1 pr-12"
            dangerouslySetInnerHTML={{ __html: highlightText(displayTitle) }}
          />
        </div>
      </div>
    </article>
  );
}
