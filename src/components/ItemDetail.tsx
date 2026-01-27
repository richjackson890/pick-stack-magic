import { SavedItem, CATEGORIES } from '@/types/pickstack';
import { PlatformBadge } from './PlatformBadge';
import { CategoryTag } from './CategoryTag';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Calendar, Edit3, Check, X } from 'lucide-react';
import { useState } from 'react';
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

  if (!item) return null;

  const handleSaveNote = () => {
    onUpdate?.(item.id, { user_note: note });
    setIsEditingNote(false);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory as typeof category);
    onUpdate?.(item.id, { category: newCategory as typeof category });
  };

  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
        </SheetHeader>

        <div className="max-w-2xl mx-auto space-y-6 pb-8">
          {/* Thumbnail */}
          {item.thumbnail_url ? (
            <div className="relative -mx-6 -mt-6 mb-6">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full max-h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-4" />
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 flex-wrap">
            <PlatformBadge platform={item.platform} size="md" />
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent">
                <CategoryTag category={item.category} size="md" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {item.title}
          </h1>

          {/* 3-Line Summary */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-xs text-white">
                ✨
              </span>
              AI 3줄 요약
            </h3>
            <ul className="space-y-2">
              {item.summary_3lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="text-primary font-medium shrink-0">{idx + 1}.</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* User Note */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">나의 메모</h3>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  편집
                </button>
              )}
            </div>
            {isEditingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  className="min-h-[100px]"
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
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px]">
                {item.user_note || '메모가 없습니다.'}
              </p>
            )}
          </div>

          {/* Original Link */}
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
