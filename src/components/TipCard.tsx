import { motion } from 'framer-motion';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { ExternalLink, Trash2, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipCardProps {
  tip: Tip;
  category?: ArchiCategory;
  onDelete?: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'scale': '⚖',
  'trending-up': '📈',
  'palette': '🎨',
  'building': '🏗',
  'folder': '📁',
};

export function TipCard({ tip, category, onDelete }: TipCardProps) {
  const authorName = tip.profiles?.name || tip.profiles?.email?.split('@')[0] || 'Unknown';

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
        {/* Top row: category + competition name */}
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
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              {tip.likes}
            </span>
            {onDelete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
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
