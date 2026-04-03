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
import { Check, Sparkles, ChevronDown, Plus, X, Loader2, ExternalLink, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { Tip, TipInsert } from '@/hooks/useTips';
import { useUrlPreview } from '@/hooks/useUrlPreview';
import { supabase } from '@/integrations/supabase/client';

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
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하여야 합니다.'); return; }

    setUploading(true);
    try {
      // Convert to base64 for Gemini
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const publicUrl = await uploadFileToStorage(file);
      if (publicUrl) setImageUrl(publicUrl);

      // Analyze with Gemini
      analyzeImageWithGemini(base64, file.type);
    } catch (err: any) {
      console.error('[SaveModal] Upload error:', err);
      alert('이미지 업로드 실패: ' + (err.message || ''));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload a File object to Supabase and return public URL
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const ext = file.name?.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `tips/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tip-images')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('tip-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Analyze image with Gemini Vision API
  const analyzeImageWithGemini = async (base64: string, mimeType: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[SaveModal] VITE_GEMINI_API_KEY not set, skipping vision analysis');
      return;
    }

    setAnalyzingImage(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `이 이미지는 건축 관련 콘텐츠입니다. 분석하여 다음 JSON만 반환하세요 (다른 텍스트 없이):
{
  "title": "이미지 제목 (50자 이내, 한국어)",
  "description": "이미지 설명 2-3문장 (한국어, 건축 전문가 관점)",
  "tags": ["구체적태그1", "구체적태그2", "구체적태그3", "구체적태그4", "구체적태그5", "구체적태그6"],
  "suggestedCategory": "AI/디지털 | 구조/시공 | 디자인레퍼런스 | 법규검토 | 심사경향 | 기타 중 하나"
}

태그는 건축가가 실제로 검색할 구체적 키워드를 사용하세요 (도구명, 기법명, 프로젝트 유형, 전문 개념 등).` },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setContent(parsed.description);
        if (Array.isArray(parsed.tags) && parsed.tags.length > 0) setTags(parsed.tags.slice(0, 8));
        if (parsed.suggestedCategory) {
          const match = categories.find(c => c.name === parsed.suggestedCategory);
          if (match) setSelectedCategoryId(match.id);
        }
        console.log('[SaveModal] Gemini analysis result:', parsed);
      }
    } catch (err) {
      console.error('[SaveModal] Gemini vision error:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Handle clipboard paste (Ctrl+V image)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) continue;

      e.preventDefault();
      const file = item.getAsFile();
      if (!file || file.size > 5 * 1024 * 1024) {
        alert('이미지는 5MB 이하여야 합니다.');
        return;
      }

      setUploading(true);
      try {
        // Convert to base64 for Gemini
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // strip data:...;base64, prefix
          };
          reader.readAsDataURL(file);
        });

        // Upload to storage
        const publicUrl = await uploadFileToStorage(file);
        if (publicUrl) setImageUrl(publicUrl);

        // Analyze with Gemini (async, don't block)
        analyzeImageWithGemini(base64, file.type);
      } catch (err: any) {
        console.error('[SaveModal] Paste upload error:', err);
        alert('이미지 업로드 실패: ' + (err.message || ''));
      } finally {
        setUploading(false);
      }
      return; // Only process first image
    }
  };

  // Initialize default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const defaultCat = getDefaultCategory();
      if (defaultCat) setSelectedCategoryId(defaultCat.id);
    }
  }, [categories, selectedCategoryId, getDefaultCategory]);

  // Reset form only when modal opens (not on every re-render while open)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Modal just opened
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
    prevOpenRef.current = isOpen;
  }, [isOpen, editingTip]);

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

  // Auto-apply preview data — watch primitive values, not object reference
  useEffect(() => {
    if (preview?.title) setTitle(preview.title);
    if (preview?.description) setContent(preview.description);
    if (preview?.image) setImageUrl(preview.image);
  }, [preview?.title, preview?.description, preview?.image]);

  useEffect(() => {
    if (!preview) return;
    if (preview.tags.length > 0) setTags(preview.tags);
    if (preview.suggestedCategory) {
      const match = categories.find(c => c.name === preview.suggestedCategory);
      if (match) setSelectedCategoryId(match.id);
    }
  }, [preview?.tags, preview?.suggestedCategory, categories]);

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
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto" onPaste={handlePaste}>
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
                    <p className="text-[10px] text-muted-foreground text-center mt-2">AI 분석 결과가 자동으로 적용됩니다</p>
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

            {/* Image URL / Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (image link)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="이미지 업로드"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="w-full h-24 object-cover rounded-lg mt-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}
              {analyzingImage && (
                <div className="flex items-center gap-2 text-xs text-primary mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  이미지 분석 중...
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">Ctrl+V로 이미지를 붙여넣을 수 있습니다</p>
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
