import { useState, useEffect } from 'react';
import { Category, Platform, CATEGORIES, SavedItem } from '@/types/pickstack';
import { CategoryTag } from './CategoryTag';
import { PlatformBadge } from './PlatformBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Loader2, Sparkles, Link, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<SavedItem, 'id' | 'created_at'>) => void;
  initialUrl?: string;
}

export function SaveModal({ isOpen, onClose, onSave, initialUrl }: SaveModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('Web');
  const [category, setCategory] = useState<Category>('기타');
  const [thumbnail, setThumbnail] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'text' | 'image'>('url');

  // Simulate AI analysis when URL changes
  useEffect(() => {
    if (url && isOpen) {
      analyzeContent(url);
    }
  }, [url, isOpen]);

  const analyzeContent = async (inputUrl: string) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Detect platform from URL
    const detectedPlatform = detectPlatform(inputUrl);
    setPlatform(detectedPlatform);

    // Simulate AI-generated data
    setTitle('분석된 콘텐츠 제목이 여기에 표시됩니다');
    setCategory(detectCategory(inputUrl));
    setSummary([
      '첫 번째 요약 문장입니다.',
      '두 번째 요약 문장입니다.',
      '세 번째 요약 문장입니다.',
    ]);
    setThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop');
    
    setIsAnalyzing(false);
  };

  const detectPlatform = (url: string): Platform => {
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'X';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('pinterest.com')) return 'Pinterest';
    if (url.includes('naver.com')) return 'Naver';
    if (url.includes('brunch.co.kr')) return 'Brunch';
    return 'Web';
  };

  const detectCategory = (url: string): Category => {
    // Simple keyword matching for demo
    if (url.includes('health') || url.includes('운동')) return '건강';
    if (url.includes('invest') || url.includes('crypto')) return '투자';
    if (url.includes('recipe') || url.includes('cook')) return '레시피';
    if (url.includes('architecture') || url.includes('design')) return '건축';
    if (url.includes('render') || url.includes('3d')) return '렌더링';
    return '기타';
  };

  const handleSave = () => {
    setIsSaved(true);
    
    onSave({
      source_type: sourceType,
      url: sourceType === 'url' ? url : undefined,
      title,
      platform,
      thumbnail_url: thumbnail,
      summary_3lines: summary,
      tags: ['태그1', '태그2', '태그3'],
      category,
      user_note: note || undefined,
    });

    // Show success animation then close
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      // Reset form
      setUrl('');
      setTitle('');
      setNote('');
    }, 1200);
  };

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
                      <PlatformBadge platform={platform} size="md" />
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
                    <label className="text-sm font-medium">카테고리</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <CategoryTag
                          key={cat}
                          category={cat}
                          size="md"
                          selected={category === cat}
                          onClick={() => setCategory(cat)}
                        />
                      ))}
                    </div>
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
