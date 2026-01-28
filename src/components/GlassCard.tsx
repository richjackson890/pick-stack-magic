import { motion, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { useState, useRef } from 'react';
import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, Share2, Pin } from 'lucide-react';

interface GlassCardProps {
  item: DbItem;
  category?: DbCategory;
  onClick: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onPin?: () => void;
  isMasonry?: boolean;
}

export function GlassCard({ 
  item, 
  category, 
  onClick, 
  onDelete,
  onShare,
  onPin,
  isMasonry = false 
}: GlassCardProps) {
  const hasThumbnail = !!item.thumbnail_url;
  const isAnalyzing = item.ai_status === 'pending' || item.ai_status === 'processing';
  
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);
  
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 400, damping: 30 });
  
  const leftActionOpacity = useTransform(springX, [0, 60], [0, 1]);
  const rightActionOpacity = useTransform(springX, [-60, 0], [1, 0]);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    
    if (info.offset.x > threshold) {
      // Right swipe - Share/Pin
      setShowActions('right');
      onShare?.();
    } else if (info.offset.x < -threshold) {
      // Left swipe - Delete
      setShowActions('left');
      onDelete?.();
    }
    
    x.set(0);
    setTimeout(() => setShowActions(null), 300);
  };
  
  const handlePointerDown = () => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true);
    }, 500);
  };
  
  const handlePointerUp = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  
  const handleClick = () => {
    if (!isLongPressed) {
      onClick();
    }
    setIsLongPressed(false);
  };

  return (
    <div className={cn('relative', isMasonry && 'masonry-item')}>
      {/* Swipe Action Backgrounds */}
      <motion.div 
        className="absolute inset-0 rounded-2xl flex items-center justify-start pl-4 bg-gradient-to-r from-neon-cyan/20 to-transparent"
        style={{ opacity: rightActionOpacity }}
      >
        <div className="glass-chip p-2">
          <Share2 className="h-4 w-4 text-neon-cyan" />
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-4 bg-gradient-to-l from-destructive/20 to-transparent"
        style={{ opacity: leftActionOpacity }}
      >
        <div className="glass-chip p-2">
          <Trash2 className="h-4 w-4 text-destructive" />
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.article
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x: springX }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        animate={{
          boxShadow: isPressed 
            ? '0 2px 10px hsl(0 0% 0% / 0.2)' 
            : '0 4px 20px hsl(0 0% 0% / 0.15), 0 0 0 1px hsl(0 0% 100% / 0.05)',
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30,
          mass: 0.8
        }}
        className={cn(
          'glass-card cursor-pointer relative overflow-hidden',
          'touch-pan-y'
        )}
      >
        {/* Glass Highlight Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          animate={{
            background: isPressed 
              ? 'linear-gradient(135deg, hsl(0 0% 100% / 0.05) 0%, transparent 50%)'
              : 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, transparent 50%)',
          }}
          transition={{ duration: 0.2 }}
        />

        <div className={cn(
          'relative overflow-hidden',
          isMasonry ? 'aspect-auto' : 'aspect-square'
        )}>
          {hasThumbnail ? (
            <motion.img 
              src={item.thumbnail_url!} 
              alt={item.title} 
              className="w-full h-full object-cover"
              loading="lazy"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-3 min-h-[120px]"
              style={{ 
                background: `linear-gradient(135deg, ${category?.color || '#6b7280'}, ${category?.color || '#6b7280'}dd)` 
              }}
            >
              <PlatformIcon platform={item.platform} size="lg" className="mb-2 opacity-90" />
              <span className="text-[10px] text-white/90 text-center line-clamp-2 font-medium">
                {item.title}
              </span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
          
          {/* Platform Badge - Glass Circle */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <motion.div 
              className="glass-chip p-0.5"
              whileHover={{ scale: 1.1 }}
            >
              <PlatformIcon platform={item.platform} size="sm" />
            </motion.div>
            
            {isAnalyzing && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-chip flex items-center gap-1 px-2 py-0.5"
              >
                <Loader2 className="h-2.5 w-2.5 animate-spin text-neon-cyan" />
                <span className="text-2xs font-medium text-foreground/80">분석중</span>
              </motion.span>
            )}
          </div>
          
          {/* Category Chip */}
          <motion.span 
            className="absolute bottom-2 right-2 glass-chip text-2xs font-semibold px-2 py-0.5 flex items-center gap-1"
            style={{ 
              backgroundColor: `${category?.color}cc` || 'hsl(var(--muted) / 0.8)',
              color: 'white',
              textShadow: '0 1px 2px hsl(0 0% 0% / 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            {category?.icon && <span className="text-xs">{category.icon}</span>}
            {category?.name || '기타'}
          </motion.span>
          
          {/* Title Overlay */}
          {hasThumbnail && (
            <div className="absolute bottom-0 left-0 right-0 p-2 pt-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h3 className="text-xs font-semibold text-white line-clamp-1 pr-16 drop-shadow-md">
                {item.title}
              </h3>
            </div>
          )}
        </div>
      </motion.article>

      {/* Long Press Quick Peek Modal */}
      {isLongPressed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsLongPressed(false)}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="glass-sheet rounded-3xl p-4 m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video rounded-xl overflow-hidden mb-3">
              {hasThumbnail ? (
                <img src={item.thumbnail_url!} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: category?.color || '#6b7280' }}
                >
                  <PlatformIcon platform={item.platform} size="lg" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
            <div className="flex gap-2">
              <button 
                className="flex-1 glass-button py-2 px-3 text-sm font-medium flex items-center justify-center gap-2"
                onClick={() => { onPin?.(); setIsLongPressed(false); }}
              >
                <Pin className="h-4 w-4" /> 핀 고정
              </button>
              <button 
                className="flex-1 glass-button py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 text-destructive"
                onClick={() => { onDelete?.(); setIsLongPressed(false); }}
              >
                <Trash2 className="h-4 w-4" /> 삭제
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
