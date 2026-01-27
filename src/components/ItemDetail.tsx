import { SavedItem, CATEGORIES, CATEGORY_COLORS, PLATFORM_COLORS } from '@/types/pickstack';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ExternalLink, Calendar, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ItemDetailProps {
  item: SavedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<SavedItem>) => void;
}

export function ItemDetail({ item, isOpen, onClose, onUpdate }: ItemDetailProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(item?.user_note || '');
  const [category, setCategory] = useState(item?.category);

  useEffect(() => {
    if (item) {
      setNote(item.user_note || '');
      setCategory(item.category);
    }
  }, [item]);

  if (!item) return null;

  const handleSaveNote = () => {
    onUpdate?.(item.id, { user_note: note });
    setIsEditingNote(false);
  };

  const handleCategoryChange = (newCategory: typeof category) => {
    setCategory(newCategory);
    onUpdate?.(item.id, { category: newCategory });
  };

  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
        </SheetHeader>

        <div className="max-w-2xl mx-auto space-y-4 pb-6">
          {/* Large Thumbnail with Overlay Badges */}
          <div className="relative -mx-6 -mt-6 mb-4">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className={cn(
                "w-full aspect-video flex items-center justify-center",
                PLATFORM_COLORS[item.platform]
              )}>
                <span className="text-5xl text-white/90 font-bold">
                  {item.platform.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            {/* Platform & Category Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={cn(
                "text-xs font-medium text-white px-2 py-1 rounded-full",
                PLATFORM_COLORS[item.platform]
              )}>
                {item.platform}
              </span>
              <span className={cn(
                "text-xs font-medium text-white px-2 py-1 rounded-full",
                CATEGORY_COLORS[item.category]
              )}>
                {item.category}
              </span>
            </div>

            {/* Open Original - Fixed Top Right */}
            {item.url && (
              <Button
                size="sm"
                className="absolute top-3 right-3"
                onClick={() => window.open(item.url, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                원본
              </Button>
            )}
          </div>

          {/* Title & Date */}
          <div>
            <h1 className="text-lg font-bold text-foreground leading-snug mb-1">
              {item.title}
            </h1>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>

          {/* 3-Line Summary - Improved readability */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-xs text-white">
                ✨
              </span>
              AI 3줄 요약
            </h3>
            <ul className="space-y-2.5">
              {item.summary_3lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                  <span className="text-primary font-semibold shrink-0 mt-0.5">{idx + 1}.</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Category Change - 1-tap chips */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">카테고리 변경</h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium transition-all",
                    category === cat
                      ? cn("text-white", CATEGORY_COLORS[cat])
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* User Note - Direct input */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">나의 메모</h3>
            {isEditingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  className="min-h-[80px] text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNote}>
                    <Check className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingNote(false)}>
                    <X className="h-3 w-3 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingNote(true)}
                className="w-full text-left text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px] hover:bg-muted transition-colors"
              >
                {item.user_note || '탭하여 메모 추가...'}
              </button>
            )}
          </div>

          {/* Bottom Open Original Button (if exists) */}
          {item.url && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(item.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              원본 열기
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
