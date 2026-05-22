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
import { Check, Sparkles, ChevronDown, Plus, X, Loader2, ExternalLink, Upload, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuideTooltip } from '@/components/GuideTooltip';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { Tip, TipInsert, TipAttachment, ATTACHMENT_LABELS, AttachmentLabel, MAX_FREE_ATTACHMENTS } from '@/hooks/useTips';
import { useUrlPreview } from '@/hooks/useUrlPreview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_ATTACHMENT_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'pptx', 'docx', 'xlsx', 'zip'];
const ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.pptx,.docx,.xlsx,.zip';

const getFileNameFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname;
    const last = decodeURIComponent(path.split('/').pop() || '');
    return last.replace(/^\d+_/, '') || last;
  } catch {
    return url;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const { user } = useAuth();
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
  const [privateOnly, setPrivateOnly] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  // Labeled slots: existing url from DB or freshly picked File pending upload.
  const [labeledSlots, setLabeledSlots] = useState<Record<string, { existingUrl?: string; pending?: File }>>({});
  // Free attachments: existing URLs from DB and freshly picked Files pending upload.
  const [freeExisting, setFreeExisting] = useState<string[]>([]);
  const [freePending, setFreePending] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labeledInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const freeAttachmentInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `이 건축 이미지를 분석하고 반드시 아래 형식의 JSON만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:\n{"title": "제목", "description": "설명", "tags": ["태그1", "태그2"], "category": "카테고리"}\ntitle: 건축 팁 제목 (30자 이내)\ndescription: 이 이미지에서 배울 수 있는 건축 설계 인사이트 (100자 이내)\ntags: 건축가가 검색할 구체적 키워드 5개 배열\ncategory: 다음 중 하나 선택 - 구조/시설, 기타, 디자인/렌더링, 법규/행정, 소프트웨어` },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          }],
          generation_config: { temperature: 0.3, max_output_tokens: 1024 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

      const data = await res.json();
      console.log('[Gemini Raw Response]', JSON.stringify(data));
      const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      console.log('[Gemini Text]', text);
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed) {
        console.log('[Gemini Parsed]', parsed);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setContent(parsed.description);
        if (Array.isArray(parsed.tags) && parsed.tags.length > 0) setTags(parsed.tags.slice(0, 8));
        const catName = parsed.category || parsed.suggestedCategory;
        if (catName) {
          const match = categories.find(c => c.name === catName);
          if (match) setSelectedCategoryId(match.id);
        }
      } else {
        console.warn('[Gemini] Failed to parse JSON from:', text);
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

      setFreePending([]);

      if (editingTip) {
        setTitle(editingTip.title || '');
        setContent(editingTip.content || '');
        setUrl(editingTip.url || '');
        setImageUrl(editingTip.image_url || '');
        setTags(editingTip.tags || []);
        setCompetitionName(editingTip.competition_name || '');
        setSelectedCategoryId(editingTip.category || '');
        setPrivateOnly(!editingTip.team_id);

        const slots: Record<string, { existingUrl?: string }> = {};
        const free: string[] = [];
        (editingTip.attachments || []).forEach(att => {
          if (att.label && (ATTACHMENT_LABELS as readonly string[]).includes(att.label)) {
            slots[att.label] = { existingUrl: att.url };
          } else {
            free.push(att.url);
          }
        });
        setLabeledSlots(slots);
        setFreeExisting(free);
      } else {
        setTitle('');
        setContent('');
        setUrl('');
        setImageUrl('');
        setTags([]);
        setCompetitionName('');
        setPrivateOnly(false);
        setLabeledSlots({});
        setFreeExisting([]);
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

  const validateAttachment = (file: File): string | null => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTS.includes(ext)) return '지원하지 않는 형식';
    if (file.size > MAX_ATTACHMENT_SIZE) return '20MB 초과';
    return null;
  };

  const handlePickLabeled = (label: AttachmentLabel) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateAttachment(file);
    if (err) {
      alert(`${file.name} (${err})`);
      e.target.value = '';
      return;
    }
    setLabeledSlots(prev => ({ ...prev, [label]: { ...(prev[label] || {}), pending: file } }));
    e.target.value = '';
  };

  const handleClearLabeled = (label: AttachmentLabel) => {
    setLabeledSlots(prev => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  };

  const handleAddFreeAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalCount = freeExisting.length + freePending.length;
    const remaining = MAX_FREE_ATTACHMENTS - totalCount;
    if (remaining <= 0) {
      alert(`추가 첨부파일은 최대 ${MAX_FREE_ATTACHMENTS}개까지 추가할 수 있습니다.`);
      if (freeAttachmentInputRef.current) freeAttachmentInputRef.current.value = '';
      return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(files)) {
      if (accepted.length >= remaining) {
        rejected.push(`${file.name} (개수 초과)`);
        continue;
      }
      const err = validateAttachment(file);
      if (err) {
        rejected.push(`${file.name} (${err})`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) setFreePending(prev => [...prev, ...accepted]);
    if (rejected.length > 0) alert(`다음 파일은 추가되지 않았습니다:\n${rejected.join('\n')}`);
    if (freeAttachmentInputRef.current) freeAttachmentInputRef.current.value = '';
  };

  const handleRemoveFreePending = (index: number) => {
    setFreePending(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFreeExisting = (urlToRemove: string) => {
    setFreeExisting(prev => prev.filter(u => u !== urlToRemove));
  };

  const uploadAttachment = async (file: File): Promise<string> => {
    const userId = user?.id || 'anonymous';
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${userId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('tip-attachments')
      .upload(path, file, { contentType: file.type || 'application/octet-stream' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('tip-attachments')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const finalAttachments: TipAttachment[] = [];
    const hasUploads =
      ATTACHMENT_LABELS.some(l => labeledSlots[l]?.pending) || freePending.length > 0;

    if (hasUploads) setUploadingAttachments(true);
    try {
      // Labeled slots first, preserving canonical label order
      for (const label of ATTACHMENT_LABELS) {
        const slot = labeledSlots[label];
        if (!slot) continue;
        if (slot.pending) {
          const url = await uploadAttachment(slot.pending);
          finalAttachments.push({ label, url });
        } else if (slot.existingUrl) {
          finalAttachments.push({ label, url: slot.existingUrl });
        }
      }
      // Free attachments
      for (const url of freeExisting) {
        finalAttachments.push({ label: null, url });
      }
      for (const file of freePending) {
        const url = await uploadAttachment(file);
        finalAttachments.push({ label: null, url });
      }
    } catch (err: any) {
      console.error('[SaveModal] Attachment upload error:', err);
      alert('첨부파일 업로드 실패: ' + (err.message || ''));
      setUploadingAttachments(false);
      return;
    }
    setUploadingAttachments(false);

    setIsSaved(true);

    onSave({
      title: title.trim(),
      content: content.trim() || undefined,
      url: url.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      category: selectedCategoryId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      competition_name: competitionName.trim() || undefined,
      team_id: !privateOnly && teamId ? teamId : null,
      attachments: finalAttachments,
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
              <p className="text-[10px] text-muted-foreground">YouTube, ArchDaily, 블로그 등 URL을 붙여넣으면 AI가 자동으로 내용을 분석해요</p>

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
              <p className="text-[10px] text-muted-foreground">Ctrl+V로 스크린샷을 바로 붙여넣거나, 이미지 URL을 입력하세요. AI가 내용을 분석해드려요</p>
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

            {/* Attachments — Section A: 4 fixed labeled slots */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                분류별 첨부파일
              </label>
              <div className="space-y-2">
                {ATTACHMENT_LABELS.map(label => {
                  const slot = labeledSlots[label];
                  const hasFile = !!(slot?.pending || slot?.existingUrl);
                  const displayName = slot?.pending
                    ? slot.pending.name
                    : slot?.existingUrl
                      ? getFileNameFromUrl(slot.existingUrl)
                      : '';
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-16 shrink-0">{label}</span>
                      {hasFile ? (
                        <>
                          <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-primary/5 text-xs flex items-center gap-2">
                            <Paperclip className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate" title={displayName}>{displayName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClearLabeled(label)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            title="제거"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => labeledInputRefs.current[label]?.click()}
                          className="flex-1 justify-start"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          파일선택
                        </Button>
                      )}
                      <input
                        ref={el => { labeledInputRefs.current[label] = el; }}
                        type="file"
                        accept={ATTACHMENT_ACCEPT}
                        onChange={handlePickLabeled(label)}
                        className="hidden"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attachments — Section B: up to N free attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                추가 첨부파일 (최대 {MAX_FREE_ATTACHMENTS}개)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => freeAttachmentInputRef.current?.click()}
                disabled={freeExisting.length + freePending.length >= MAX_FREE_ATTACHMENTS}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                파일 추가
              </Button>
              <input
                ref={freeAttachmentInputRef}
                type="file"
                accept={ATTACHMENT_ACCEPT}
                multiple
                onChange={handleAddFreeAttachments}
                className="hidden"
              />
              <p className="text-[10px] text-muted-foreground">
                PDF, PNG, JPG, GIF, PPTX, DOCX, XLSX, ZIP · 파일당 최대 20MB
              </p>

              {(freeExisting.length > 0 || freePending.length > 0) && (
                <div className="space-y-1.5">
                  {freeExisting.map((u, i) => (
                    <div key={`fexist-${i}`} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-secondary/50 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate" title={getFileNameFromUrl(u)}>{getFileNameFromUrl(u)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFreeExisting(u)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="제거"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {freePending.map((f, i) => (
                    <div key={`fpend-${i}`} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-primary/5 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate" title={f.name}>{f.name}</span>
                        <span className="text-muted-foreground shrink-0">{formatBytes(f.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFreePending(i)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="제거"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Share Toggle */}
            {teamId && (
              <GuideTooltip name="share_team" message="팀원들과 팁을 공유할 수 있어요" position="bottom">
                <div className="w-full">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">나만 보기</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={privateOnly}
                      onChange={(e) => setPrivateOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1 px-3">
                    {privateOnly
                      ? '나만 볼 수 있어요'
                      : '팀원 전체에게 공유됩니다'}
                  </p>
                </div>
              </GuideTooltip>
            )}

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
              onClick={handleSave}
              disabled={!title.trim() || uploadingAttachments}
            >
              {uploadingAttachments ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  첨부파일 업로드 중...
                </span>
              ) : (
                editingTip ? 'Update Tip' : 'Save Tip'
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
