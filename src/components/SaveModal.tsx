import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Sparkles, ChevronDown, Plus, X, Loader2, Wand2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { Tip, TipInsert } from '@/hooks/useTips';
import { useUrlPreview } from '@/hooks/useUrlPreview';

interface SaveModalProps {
  isOpen: boolean;
  categories: ArchiCategory[];
  getDefaultCategory: () => ArchiCategory | undefined;
  onClose: () => void;
  onSave: (tip: TipInsert) => void;
  editingTip?: Tip | null;
  teamId?: string | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'scale': '⚖',
  'trending-up': '📈',
  'palette': '🎨',
  'building': '🏗',
  'folder': '📁',
  'robot': '🤖',
};

export function SaveModal({ isOpen, categories, getDefaultCategory, onClose, onSave, editingTip, teamId }: SaveModalProps) {
  const { preview, loading: previewLoading, error: previewError, fetchPreview, clearPreview } = useUrlPreview();
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
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const defaultCat = getDefaultCategory();
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [categories, selectedCategoryId, getDefaultCategory]);

  // Reset form when opened, or populate with editing data
  useEffect(() => {
    if (isOpen) {
      setShowCategorySelector(false);
      setIsSaved(false);
      clearPreview();
      setTagInput('');

      if (editingTip) {
        setTitle(editingTip.title || '');
        setContent(editingTip.content || '');
        setUrl(editingTip.url || '');
        setImageUrl(editingTip.image_url || '');
        setTags(editingTip.tags || []);
        setCompetitionName(editingTip.competition_name || '');
        setSelectedCategoryId(editingTip.category || '');
        setShareWithTeam(!!editingTip.team_id);
      } else {
        setTitle('');
        setContent('');
        setUrl('');
        setImageUrl('');
        setTags([]);
        setCompetitionName('');
        setShareWithTeam(false);
        const defaultCat = getDefaultCategory();
        if (defaultCat) setSelectedCategoryId(defaultCat.id);
      }
    }
  }, [isOpen, editingTip, getDefaultCategory, clearPreview]);

  // Debounced URL preview fetch
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    clearPreview();

    if (newUrl.startsWith('http')) {
      debounceRef.current = setTimeout(() => {
        fetchPreview(newUrl, categories);
      }, 800);
    }
  };

  // Auto-apply preview data when it arrives
  useEffect(() => {
    if (preview) applyPreview();
  }, [preview]);

  // Apply AI suggestions from preview
  const applyPreview = () => {
    if (!preview) {
      console.warn('[SaveModal] applyPreview called but no preview data');
      return;
    }
    console.log('[SaveModal] Applying preview:', preview);
    if (preview.title) setTitle(preview.title);
    if (preview.description) setContent(preview.description);
    if (preview.image) setImageUrl(preview.image);
    if (preview.tags.length > 0) setTags(preview.tags);
    if (preview.suggestedCategory) {
      const match = categories.find(c => c.name === preview.suggestedCategory);
      if (match) setSelectedCategoryId(match.id);
    }
  };

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
      team_id: shareWithTeam && teamId ? teamId : null,
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
            {editingTip ? 'Edit Tip' : 'Share a Tip'}
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
            {/* URL with preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference URL</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://... (paste a link to auto-fill)"
              />

              {/* URL Preview loading */}
              {previewLoading && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">AI가 URL을 분석하고 있습니다...</span>
                </div>
              )}

              {/* URL Preview result */}
              {preview && !previewLoading && (
                <div className="rounded-lg border border-border/50 overflow-hidden bg-secondary/30">
                  {preview.image && (
                    <img
                      src={preview.image}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="p-3 space-y-1.5">
                    {preview.title && (
                      <p className="text-sm font-medium line-clamp-2">{preview.title}</p>
                    )}
                    {preview.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
                    )}
                    {preview.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {preview.tags.slice(0, 4).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">#{t}</span>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyPreview}
                      disabled={!preview}
                      className="w-full mt-2 text-xs gap-1.5"
                    >
                      <Wand2 className="h-3 w-3" />
                      AI 추천 적용하기
                    </Button>
                  </div>
                </div>
              )}

              {previewError && (
                <p className="text-xs text-muted-foreground">미리보기를 불러올 수 없습니다</p>
              )}
            </div>

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
                        {CATEGORY_EMOJI[selectedCategory.icon] || '📁'}
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

            {/* Team Share Toggle */}
            {teamId && (
              <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Share with Team</span>
                </div>
                <input
                  type="checkbox"
                  checked={shareWithTeam}
                  onChange={(e) => setShareWithTeam(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
              </label>
            )}

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {editingTip ? 'Update Tip' : 'Save Tip'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
