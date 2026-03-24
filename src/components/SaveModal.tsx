import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Sparkles, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { TipInsert } from '@/hooks/useTips';

interface SaveModalProps {
  isOpen: boolean;
  categories: ArchiCategory[];
  getDefaultCategory: () => ArchiCategory | undefined;
  onClose: () => void;
  onSave: (tip: TipInsert) => void;
}

export function SaveModal({ isOpen, categories, getDefaultCategory, onClose, onSave }: SaveModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [competitionName, setCompetitionName] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Initialize default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const defaultCat = getDefaultCategory();
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [categories, selectedCategoryId, getDefaultCategory]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setUrl('');
      setImageUrl('');
      setTags([]);
      setTagInput('');
      setCompetitionName('');
      setShowCategorySelector(false);
      setIsSaved(false);
      const defaultCat = getDefaultCategory();
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [isOpen, getDefaultCategory]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    setIsSaved(true);

    onSave({
      title: title.trim(),
      content: content.trim() || undefined,
      url: url.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      category: selectedCategoryId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      competition_name: competitionName.trim() || undefined,
    });

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            Share a Tip
          </SheetTitle>
        </SheetHeader>

        {isSaved ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-check-bounce">
              <Check className="h-10 w-10 text-white" />
            </div>
            <p className="text-lg font-semibold text-foreground">Saved!</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5 pb-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Architecture tip title..."
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the tip, insight, or lesson learned..."
                className="min-h-[100px]"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference URL</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (image link)"
              />
            </div>

            {/* Competition Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Competition / Project Name</label>
              <Input
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="e.g. 세종시 공공청사 설계공모"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>

              <button
                onClick={() => setShowCategorySelector(!showCategorySelector)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedCategory && (
                    <>
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ backgroundColor: selectedCategory.color }}
                      >
                        {selectedCategory.icon === 'scale' ? '⚖' :
                         selectedCategory.icon === 'trending-up' ? '📈' :
                         selectedCategory.icon === 'palette' ? '🎨' :
                         selectedCategory.icon === 'building' ? '🏗' :
                         '📁'}
                      </span>
                      <span className="font-medium text-sm">{selectedCategory.name}</span>
                    </>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showCategorySelector && "rotate-180"
                )} />
              </button>

              {showCategorySelector && (
                <div className="space-y-2 p-2 bg-secondary/30 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setShowCategorySelector(false);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          selectedCategoryId === cat.id
                            ? "text-white ring-2 ring-offset-1 ring-foreground/20"
                            : "bg-secondary text-secondary-foreground hover:opacity-80"
                        )}
                        style={selectedCategoryId === cat.id ? { backgroundColor: cat.color } : undefined}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddTag} type="button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Save Tip
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
