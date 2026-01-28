import { useState, useEffect, useCallback } from 'react';
import { Platform } from '@/types/pickstack';
import { DbCategory } from '@/hooks/useDbCategories';
import { CategoryChip } from '@/components/CategoryBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Loader2, Sparkles, Link, FileText, Image, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { classifyItem } from '@/utils/classifier';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaveModalProps {
  isOpen: boolean;
  categories: DbCategory[];
  getDefaultCategory: () => DbCategory;
  onClose: () => void;
  onSave: (item: {
    source_type: 'url' | 'text' | 'image';
    url?: string;
    title: string;
    platform: Platform;
    thumbnail_url?: string;
    summary_3lines: string[];
    tags: string[];
    category_id: string;
    user_note?: string;
    ai_confidence?: number;
    ai_reason?: string;
  }) => void;
  initialUrl?: string;
}

export function SaveModal({ isOpen, categories, getDefaultCategory, onClose, onSave, initialUrl }: SaveModalProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('Web');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [thumbnail, setThumbnail] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'text' | 'image'>('url');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [top3Categories, setTop3Categories] = useState<{ category_id: string; score: number }[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initialize default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(getDefaultCategory().id);
    }
  }, [categories, selectedCategoryId, getDefaultCategory]);

  // Debounced AI analysis when URL changes
  useEffect(() => {
    if (!url || !isOpen) return;
    
    const timeoutId = setTimeout(() => {
      analyzeContent(url);
    }, 800); // Debounce 800ms

    return () => clearTimeout(timeoutId);
  }, [url, isOpen]);

  // Platform detection from URL - INCLUDES threads.com AND threads.net
  const detectPlatform = useCallback((inputUrl: string): Platform => {
    const urlLower = inputUrl.toLowerCase();
    if (urlLower.includes('instagram.com')) return 'Instagram';
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
    if (urlLower.includes('tiktok.com')) return 'TikTok';
    if (urlLower.includes('threads.net') || urlLower.includes('threads.com')) return 'Threads';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'X';
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) return 'Facebook';
    if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) return 'Pinterest';
    if (urlLower.includes('reddit.com')) return 'Reddit';
    if (urlLower.includes('linkedin.com')) return 'LinkedIn';
    if (urlLower.includes('medium.com')) return 'Medium';
    if (urlLower.includes('naver.com') || urlLower.includes('blog.naver')) return 'Naver';
    if (urlLower.includes('brunch.co.kr')) return 'Brunch';
    return 'Web';
  }, []);

  const analyzeContent = async (inputUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Detect platform immediately for UI feedback
    const detectedPlatform = detectPlatform(inputUrl);
    setPlatform(detectedPlatform);

    try {
      // Call the preview-analyze Edge Function for real AI analysis
      const categoryData = categories.map(c => ({
        id: c.id,
        name: c.name,
        keywords: c.keywords || '',
      }));

      const { data, error } = await supabase.functions.invoke('preview-analyze', {
        body: { 
          url: inputUrl,
          categories: categoryData,
        },
      });

      if (error) {
        console.error('[SaveModal] Preview analyze error:', error);
        throw new Error(error.message);
      }

      if (data?.success) {
        // Use AI-analyzed data
        setTitle(data.title || `${detectedPlatform} 콘텐츠`);
        setPlatform(data.platform || detectedPlatform);
        setThumbnail(data.thumbnail_url || '');
        setSummary(data.summary_3 || []);
        setTags(data.tags || []);
        setAiConfidence(data.confidence || 0.5);

        // Find matching category by name
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === (data.final_category || '').toLowerCase()
        );
        
        if (matchedCategory) {
          setSelectedCategoryId(matchedCategory.id);
        } else {
          // Fallback to classifier
          const adaptedCategories = categories.map(c => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon || undefined,
            keywords: c.keywords || undefined,
            sort_order: c.sort_order,
            created_at: c.created_at,
            is_default: c.is_default,
          }));
          
          const classification = classifyItem(
            { platform: detectedPlatform, url: inputUrl, title: data.title },
            adaptedCategories
          );
          setSelectedCategoryId(classification.category_id);
          setTop3Categories(classification.top3_candidates);
        }

        // Show category selector if confidence is low
        setShowCategorySelector((data.confidence || 0) < 0.6);
      } else {
        throw new Error(data?.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('[SaveModal] Analysis error:', err);
      setAnalysisError(err.message);
      
      // Fallback to local classification
      const adaptedCategories = categories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon || undefined,
        keywords: c.keywords || undefined,
        sort_order: c.sort_order,
        created_at: c.created_at,
        is_default: c.is_default,
      }));
      
      const classification = classifyItem(
        { platform: detectedPlatform, url: inputUrl },
        adaptedCategories
      );
      
      setTitle(`${detectedPlatform} 콘텐츠`);
      setSelectedCategoryId(classification.category_id);
      setAiConfidence(classification.confidence);
      setTop3Categories(classification.top3_candidates);
      setSummary(['분석 중 오류 발생', '저장 후 다시 분석됩니다', '']);
      setShowCategorySelector(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    
    onSave({
      source_type: sourceType,
      url: sourceType === 'url' ? url : undefined,
      title,
      platform,
      thumbnail_url: thumbnail,
      summary_3lines: summary.length > 0 ? summary : ['저장됨', '', ''],
      tags: tags.length > 0 ? tags : ['저장됨'],
      category_id: selectedCategoryId,
      user_note: note || undefined,
      ai_confidence: aiConfidence,
    });

    // Show success animation then close
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      // Reset form
      setUrl('');
      setTitle('');
      setNote('');
      setTags([]);
      setSummary([]);
      setThumbnail('');
      setShowCategorySelector(false);
      setAnalysisError(null);
    }, 800);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            콘텐츠 저장
          </SheetTitle>
        </SheetHeader>

        {isSaved ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-check-bounce">
              <Check className="h-10 w-10 text-white" />
            </div>
            <p className="text-lg font-semibold text-foreground">저장됨 ✅</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6 pb-8">
            {/* Source Type Selector */}
            <div className="flex gap-2">
              {[
                { type: 'url' as const, icon: Link, label: 'URL' },
                { type: 'text' as const, icon: FileText, label: '텍스트' },
                { type: 'image' as const, icon: Image, label: '이미지' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setSourceType(type)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all',
                    sourceType === type
                      ? 'gradient-primary text-white'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* URL Input */}
            {sourceType === 'url' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">URL 입력</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            )}

            {/* Text Input */}
            {sourceType === 'text' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">텍스트 입력</label>
                <Textarea
                  placeholder="저장할 텍스트를 붙여넣기 하세요..."
                  className="min-h-[120px]"
                />
              </div>
            )}

            {/* Image Upload */}
            {sourceType === 'image' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">이미지 업로드</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                </div>
              </div>
            )}

            {/* AI Analysis Result */}
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI가 분석 중...</p>
              </div>
            ) : (
              url && (
                <>
                  {/* Preview Card */}
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={platform} size="md" />
                      <span className="text-xs text-muted-foreground">{platform}</span>
                    </div>

                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="font-medium"
                      placeholder="제목"
                    />

                    {summary.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">AI 3줄 요약</p>
                        {summary.map((line, idx) => (
                          <p key={idx} className="text-xs text-foreground/80">
                            {idx + 1}. {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">카테고리</label>
                      {aiConfidence > 0 && (
                        <span className="text-xs text-muted-foreground">
                          신뢰도: {Math.round(aiConfidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Selected Category Button */}
                    <button
                      onClick={() => setShowCategorySelector(!showCategorySelector)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {selectedCategory && (
                          <>
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                              style={{ backgroundColor: selectedCategory.color }}
                            >
                              {selectedCategory.icon}
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

                    {/* Category Options */}
                    {showCategorySelector && (
                      <div className="space-y-2 p-2 bg-secondary/30 rounded-lg">
                        {/* Top 3 Recommendations */}
                        {top3Categories.length > 0 && aiConfidence < 0.8 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground px-1">추천 카테고리</p>
                            <div className="flex flex-wrap gap-2">
                              {top3Categories.map(({ category_id }) => {
                                const cat = categories.find((c) => c.id === category_id);
                                if (!cat) return null;
                                return (
                                  <button
                                    key={category_id}
                                    onClick={() => {
                                      setSelectedCategoryId(category_id);
                                      setShowCategorySelector(false);
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                      selectedCategoryId === category_id
                                        ? "text-white ring-2 ring-offset-1 ring-foreground/20"
                                        : "bg-secondary text-secondary-foreground hover:opacity-80"
                                    )}
                                    style={selectedCategoryId === category_id ? { backgroundColor: cat.color } : undefined}
                                  >
                                    {cat.icon && <span>{cat.icon}</span>}
                                    {cat.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* All Categories */}
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground px-1">전체 카테고리</p>
                          <div className="flex flex-wrap gap-2">
                            {categories
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((cat) => (
                                <CategoryChip
                                  key={cat.id}
                                  category={cat}
                                  selected={selectedCategoryId === cat.id}
                                  onClick={() => {
                                    setSelectedCategoryId(cat.id);
                                    setShowCategorySelector(false);
                                  }}
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">메모 (선택)</label>
                    <Textarea
                      placeholder="메모를 남겨보세요..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </>
              )
            )}

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
              onClick={handleSave}
              disabled={isAnalyzing || (!url && sourceType === 'url')}
            >
              저장하기
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
