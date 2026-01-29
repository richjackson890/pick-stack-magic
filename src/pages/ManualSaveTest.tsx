import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDbItems } from "@/hooks/useDbItems";
import { useDbCategories } from "@/hooks/useDbCategories";
import { useContentAnalysis } from "@/hooks/useContentAnalysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Platform } from "@/types/pickstack";

// Detect platform from URL
function detectPlatform(url: string): Platform {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('threads.net')) return 'Threads';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook';
    if (host.includes('twitter') || host.includes('x.com')) return 'X';
    if (host.includes('pinterest')) return 'Pinterest';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('medium.com')) return 'Medium';
    if (host.includes('naver')) return 'Naver';
    if (host.includes('kakao')) return 'Kakao';
    if (host.includes('brunch')) return 'Brunch';
    return 'Web';
  } catch {
    return 'Web';
  }
}

export default function ManualSaveTest() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useDbItems();
  const { categories } = useDbCategories();
  const { triggerAutoAnalysis } = useContentAnalysis();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    if (!user) {
      setErrorMsg("로그인이 필요해요!");
      setStatus('error');
      return;
    }

    setStatus('saving');
    setErrorMsg("");

    try {
      const platform = detectPlatform(url);
      const summaryLines = summary
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);

      const newItem = await addItem({
        source_type: 'url',
        url: url.trim(),
        title: title.trim(),
        platform,
        thumbnail_url: null,
        summary_3lines: summaryLines,
        tags: [],
        category_id: categoryId || null,
        user_note: null,
        ai_confidence: null,
        ai_reason: '수동 입력',
        ai_status: 'done',
        ai_error: null,
        ai_started_at: null,
        ai_finished_at: new Date().toISOString(),
        ai_attempts: 0,
        extracted_text: null,
        url_hash: null,
        analysis_mode: 'none',
      });

      if (newItem) {
        setStatus('success');
        
        // Optional: trigger AI analysis in background to enhance metadata
        triggerAutoAnalysis(newItem.id).catch(console.error);

        // Reset form after short delay
        setTimeout(() => {
          setUrl("");
          setTitle("");
          setSummary("");
          setCategoryId("");
          setStatus('idle');
        }, 2000);
      } else {
        throw new Error("저장에 실패했습니다");
      }
    } catch (e: any) {
      console.error("Manual save error:", e);
      setErrorMsg(e.message || "저장 중 오류가 발생했습니다");
      setStatus('error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
          <Button onClick={() => navigate('/auth')} className="w-full">
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">수동 저장 테스트</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          <p>
            🔧 인스타 릴스가 자동으로 안 잡혀도, 여기서 직접 입력해서 저장하면 됩니다.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이 영상 핵심 정리"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">3줄 요약</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={"- 핵심 1\n- 핵심 2\n- 핵심 3"}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={status === 'saving' || !url.trim() || !title.trim()}
          className="w-full"
          size="lg"
        >
          {status === 'saving' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            "저장하기"
          )}
        </Button>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>저장 성공! ✅</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>저장 실패: {errorMsg}</span>
          </div>
        )}

        {/* Back to Home */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="w-full"
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
