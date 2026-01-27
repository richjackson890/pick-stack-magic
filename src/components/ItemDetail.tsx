import { SavedItem } from '@/types/pickstack';
import { useCategories } from '@/contexts/CategoryContext';
import { CategoryChip } from '@/components/CategoryBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExternalLink, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ItemDetailProps {
  item: SavedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<SavedItem>) => void;
}

export function ItemDetail({ item, isOpen, onClose, onUpdate }: ItemDetailProps) {
  const { categories, getCategoryById } = useCategories();
  const [note, setNote] = useState(item?.user_note || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => { if (item) setNote(item.user_note || ''); }, [item]);

  if (!item) return null;

  const currentCategory = getCategoryById(item.category_id);
  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleNoteChange = (value: string) => { setNote(value); onUpdate?.(item.id, { user_note: value }); };
  const handleCategoryChange = (categoryId: string) => { onUpdate?.(item.id, { category_id: categoryId }); setShowCategoryPicker(false); };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="sr-only"><SheetTitle>{item.title}</SheetTitle></SheetHeader>
        <div className="max-w-2xl mx-auto space-y-4 pb-6">
          <div className="relative -mx-6 -mt-6 mb-4">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.title} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center" style={{ backgroundColor: currentCategory?.color || '#6b7280' }}>
                <PlatformIcon platform={item.platform} size="lg" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
              <PlatformIcon platform={item.platform} size="md" />
              {currentCategory && <span className="text-xs font-medium text-white px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: currentCategory.color }}>{currentCategory.icon} {currentCategory.name}</span>}
            </div>
            {item.url && <Button size="sm" className="absolute top-3 right-3" onClick={() => window.open(item.url, '_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />원본</Button>}
          </div>
          <div><h1 className="text-lg font-bold text-foreground leading-snug mb-1">{item.title}</h1><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{formattedDate}</span></div>
          <div className="bg-secondary/50 rounded-lg p-4"><h3 className="text-sm font-semibold text-foreground mb-3">✨ AI 3줄 요약</h3><ul className="space-y-2.5">{item.summary_3lines.map((line, idx) => <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"><span className="text-primary font-semibold shrink-0">{idx + 1}.</span>{line}</li>)}</ul></div>
          <div className="flex flex-wrap gap-1.5">{item.tags.map((tag) => <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{tag}</span>)}</div>
          <div><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-medium text-muted-foreground">카테고리</h3><button onClick={() => setShowCategoryPicker(!showCategoryPicker)} className="text-xs text-primary hover:underline">{showCategoryPicker ? '닫기' : '변경'}</button></div>{showCategoryPicker ? <div className="flex flex-wrap gap-1.5">{categories.sort((a, b) => a.sort_order - b.sort_order).map((cat) => <CategoryChip key={cat.id} category={cat} selected={item.category_id === cat.id} onClick={() => handleCategoryChange(cat.id)} />)}</div> : currentCategory && <button onClick={() => setShowCategoryPicker(true)} className="text-xs font-medium text-white px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: currentCategory.color }}>{currentCategory.icon} {currentCategory.name}</button>}</div>
          <div className="space-y-2"><h3 className="text-xs font-medium text-muted-foreground">나의 메모</h3><Textarea value={note} onChange={(e) => handleNoteChange(e.target.value)} placeholder="메모를 입력하세요..." className="min-h-[80px] text-sm" /></div>
          {item.url && <Button variant="outline" className="w-full" onClick={() => window.open(item.url, '_blank')}><ExternalLink className="h-4 w-4 mr-2" />원본 열기</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}