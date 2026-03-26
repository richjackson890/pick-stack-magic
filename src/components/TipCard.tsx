import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { ExternalLink, Trash2, Heart, User, Sparkles, Loader2, ChevronDown, Pencil, MessageCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface TipCardProps {
  tip: Tip;
  category?: ArchiCategory;
  onDelete?: () => void;
  onEdit?: () => void;
  onComment?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  isAnalyzing?: boolean;
  viewMode?: ViewMode;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'scale': '⚖',
  'trending-up': '📈',
  'palette': '🎨',
  'building': '🏗',
  'folder': '📁',
  'robot': '🤖',
};

export function TipCard({ tip, category, onDelete, onEdit, onComment, onLike, onBookmark, isLiked, isBookmarked, likeCount, commentCount, isAnalyzing, viewMode = 'grid' }: TipCardProps) {
  const [showAiSection, setShowAiSection] = useState(false);
  const authorName = tip.profiles?.name || tip.profiles?.email?.split('@')[0] || 'Unknown';
  const hasAiData = tip.ai_status === 'done' && (tip.ai_summary || tip.ai_tags?.length > 0);

  if (viewMode === 'list') {
    return (
      <motion.article
        whileHover={{ scale: 1.002 }}
        whileTap={{ scale: 0.998 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="flex gap-3 p-3">
          {/* Thumbnail - left */}
          {tip.image_url ? (
            <div className="w-[120px] h-[80px] rounded-lg overflow-hidden shrink-0">
              <img
                src={tip.image_url}
                alt={tip.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-[120px] h-[80px] rounded-lg bg-secondary/50 shrink-0 flex items-center justify-center">
              <span className="text-2xl opacity-30">📌</span>
            </div>
          )}

          {/* Content - right */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top: category + title */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {category && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {CATEGORY_EMOJI[category.icon] || '📁'} {category.name}
                  </span>
                )}
                {(isAnalyzing || tip.ai_status === 'processing') && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary">
                    <Loader2 className="h-2 w-2 animate-spin" />
                    AI
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1">
                {tip.title}
              </h3>
              {tip.content && (
                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                  {tip.content}
                </p>
              )}
            </div>

            {/* Bottom: tags + actions */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1 overflow-hidden">
                {tip.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium shrink-0"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onLike?.(); }}
                  className={cn("flex items-center gap-0.5 text-[10px] transition-colors", isLiked ? "text-red-500" : "text-muted-foreground")}
                >
                  <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                  {likeCount ?? tip.likes}
                </button>
                {onComment && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                    className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {commentCount || 0}
                  </button>
                )}
                {onBookmark && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookmark(); }}
                    className={cn("transition-colors", isBookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500")}
                  >
                    <Bookmark className={cn("h-3 w-3", isBookmarked && "fill-current")} />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  // Grid view (default)
  return (
    <motion.article
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Image */}
      {tip.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={tip.image_url}
            alt={tip.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
        </div>
      )}

      <div className="p-4 space-y-2.5">
        {/* Top row: category + competition name + AI status */}
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: category.color }}
            >
              {CATEGORY_EMOJI[category.icon] || '📁'} {category.name}
            </span>
          )}
          {tip.competition_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
              🏆 {tip.competition_name}
            </span>
          )}
          {(isAnalyzing || tip.ai_status === 'processing') && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              AI 분석중
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
          {tip.title}
        </h3>

        {/* Content preview */}
        {tip.content && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {tip.content}
          </p>
        )}

        {/* AI Summary section */}
        {hasAiData && (
          <div className="space-y-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAiSection(!showAiSection); }}
              className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">AI 분석 결과</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showAiSection && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showAiSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                    {tip.ai_summary && (
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {tip.ai_summary}
                      </p>
                    )}
                    {tip.ai_tags && tip.ai_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tip.ai_tags.map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {tip.ai_suggested_category && (
                      <p className="text-[10px] text-muted-foreground">
                        추천 카테고리: <strong>{tip.ai_suggested_category}</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* URL link */}
        {tip.url && (
          <a
            href={tip.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-full"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{tip.url}</span>
          </a>
        )}

        {/* Tags */}
        {tip.tags && tip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tip.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: author + actions */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {tip.profiles?.avatar_url ? (
              <img
                src={tip.profiles.avatar_url}
                alt={authorName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
            )}
            <span>{authorName}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{new Date(tip.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className={cn("flex items-center gap-0.5 text-xs transition-colors", isLiked ? "text-red-500" : "text-muted-foreground")}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              {likeCount ?? tip.likes}
            </motion.button>
            {onComment && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onComment(); }}
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {commentCount || 0}
              </motion.button>
            )}
            {onBookmark && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onBookmark(); }}
                className={cn("transition-colors", isBookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500")}
              >
                <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
              </motion.button>
            )}
            {onEdit && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
