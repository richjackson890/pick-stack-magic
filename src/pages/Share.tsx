import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDbItems } from '@/hooks/useDbItems';
import { useContentAnalysis } from '@/hooks/useContentAnalysis';
import { Loader2, Link2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Platform } from '@/types/pickstack';

type ShareStatus = 'loading' | 'saving' | 'success' | 'error' | 'manual' | 'meta-manual';

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

// Check if URL is from Instagram or Threads (Meta platforms)
function isMetaPlatformUrl(url: string): { isMeta: boolean; platform: 'Instagram' | 'Threads' | null } {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('instagram')) {
      return { isMeta: true, platform: 'Instagram' };
    }
    if (host.includes('threads.net') || host.includes('threads.com')) {
      return { isMeta: true, platform: 'Threads' };
    }
    return { isMeta: false, platform: null };
  } catch {
    return { isMeta: false, platform: null };
  }
}

export default function Share() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useDbItems();
  const { triggerAutoAnalysis } = useContentAnalysis();
  
  const [status, setStatus] = useState<ShareStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [metaPlatform, setMetaPlatform] = useState<'Instagram' | 'Threads' | null>(null);

  // Extract URL from text (common pattern: "Title\nURL" or just URL in text)
  const extractUrlFromText = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  };

  // Derive a human title from shared text (best-effort)
  const extractTitleFromText = (text: string): string | null => {
    if (!text) return null;

    // Remove URLs and normalize whitespace
    const cleaned = text
      .replace(/https?:\/\/[^\s]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return null;

    // Prefer original line-based structure if available
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^https?:\/\//i.test(l));

    const candidates = lines.length ? lines : [cleaned];

    const bad = (s: string) => {
      const lower = s.toLowerCase();
      if (!s || s.length < 2) return true;
      if (lower.includes('instagram.com') || lower.includes('threads.net')) return true;
      if (lower === 'instagram' || lower === 'threads') return true;
      // Common share boilerplate
      if (lower.includes('check out') || lower.includes('reel') || lower.includes('on instagram')) return true;
      if (lower.includes('공유') || lower.includes('링크') || lower.includes('instagram 릴스')) return true;
      return false;
    };

    const best = candidates.find((c) => !bad(c)) || null;
    if (!best) return null;
    return best.slice(0, 80);
  };

  // Get shared data from URL params
  const sharedUrl = searchParams.get('url') || '';
  const sharedText = searchParams.get('text') || '';
  const sharedTitle = searchParams.get('title') || '';
  const hasError = searchParams.get('error');

  const saveUrl = async (url: string, title?: string) => {
    if (!user) {
      navigate('/auth', { state: { returnTo: `/share?url=${encodeURIComponent(url)}` } });
      return;
    }

    setStatus('saving');
    
    try {
      const platform = detectPlatform(url);
      
      const newItem = await addItem({
        source_type: 'url',
        url: url,
        title: title || url,
        platform: platform,
        thumbnail_url: null,
        summary_3lines: [],
        tags: [],
        category_id: null,
        user_note: null,
        ai_confidence: null,
        ai_reason: null,
        ai_status: 'pending',
        ai_error: null,
        ai_started_at: null,
        ai_finished_at: null,
        ai_attempts: 0,
        extracted_text: null,
        url_hash: null,
        analysis_mode: 'light',
      });

      if (newItem) {
        setSavedItemId(newItem.id);
        setStatus('success');
        
        // Trigger AI analysis in background
        triggerAutoAnalysis(newItem.id).catch(console.error);
        
        // Redirect to home page after short delay
        // Use replace: true to prevent back button from re-triggering save
        setTimeout(() => {
          navigate(`/?item=${newItem.id}`, { replace: true });
        }, 1500);
      } else {
        throw new Error('저장에 실패했습니다');
      }
    } catch (error: any) {
      console.error('Share save error:', error);
      setErrorMessage(error.message || '저장 중 오류가 발생했습니다');
      setStatus('error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      saveUrl(manualUrl.trim());
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (hasError) {
      setErrorMessage('공유 데이터를 처리하는 중 오류가 발생했습니다');
      setStatus('manual');
      return;
    }

    // Priority: url > extract from text > manual input
    const urlToProcess = sharedUrl || extractUrlFromText(sharedText);
    
    if (urlToProcess) {
      // Check if it's Meta platform content - require manual save due to platform restrictions
      const metaCheck = isMetaPlatformUrl(urlToProcess);
      if (metaCheck.isMeta) {
        setManualUrl(urlToProcess);
        const titleCandidate = sharedTitle || extractTitleFromText(sharedText) || '';
        setManualTitle(titleCandidate);
        setMetaPlatform(metaCheck.platform);
        setStatus('meta-manual');
        return;
      }
      
      const titleCandidate = sharedTitle || extractTitleFromText(sharedText) || undefined;
      saveUrl(urlToProcess, titleCandidate);
    } else if (sharedText && !urlToProcess) {
      setErrorMessage('링크를 찾지 못했어요');
      setStatus('manual');
    } else {
      // No data shared, show manual input
      setStatus('manual');
    }
  }, [authLoading, sharedUrl, sharedText, sharedTitle, hasError]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user && status !== 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <Link2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-xl font-bold">로그인이 필요합니다</h1>
          <p className="text-muted-foreground text-sm">
            콘텐츠를 저장하려면 먼저 로그인해주세요
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full"
          >
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Loading */}
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">공유 데이터 처리 중...</p>
          </div>
        )}

        {/* Saving */}
        {status === 'saving' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">저장 중...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold">저장 완료!</h2>
            <p className="text-sm text-muted-foreground">
              잠시 후 상세 페이지로 이동합니다...
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">저장 실패</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                홈으로
              </Button>
              <Button 
                onClick={() => setStatus('manual')}
                className="flex-1"
              >
                다시 시도
              </Button>
            </div>
          </div>
        )}

        {/* Manual Input */}
        {status === 'manual' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Link2 className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-lg font-semibold">
                {errorMessage || '링크 저장하기'}
              </h2>
              <p className="text-sm text-muted-foreground">
                저장할 URL을 직접 입력해주세요
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                type="url"
                placeholder="https://..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="w-full"
                autoFocus
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={!manualUrl.trim()}
              >
                저장하기
              </Button>
            </form>

            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              취소
            </Button>
          </div>
        )}

        {/* Meta Platform Manual Input (Instagram/Threads) */}
        {status === 'meta-manual' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto">
                <span className="text-2xl">{metaPlatform === 'Threads' ? '🧵' : '📷'}</span>
              </div>
              <h2 className="text-lg font-semibold">{metaPlatform} 콘텐츠 저장</h2>
              <div className="bg-muted/50 rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">ℹ️ 안내:</span> Meta 정책에 따라 {metaPlatform} 콘텐츠는 외부 앱에서 정보를 자동으로 가져오는 것이 제한됩니다. 
                  정확한 저장을 위해 제목을 직접 입력해주세요.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (manualUrl.trim()) saveUrl(manualUrl.trim(), manualTitle.trim() || undefined); }} className="space-y-4">
              <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">URL</label>
              <Input
                type="url"
                placeholder={metaPlatform === 'Threads' ? "https://www.threads.net/..." : "https://www.instagram.com/..."}
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">제목 (선택)</label>
                <Input
                  type="text"
                  placeholder="콘텐츠 내용을 간단히 입력해주세요"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={!manualUrl.trim()}
              >
                저장하기
              </Button>
            </form>

            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              취소
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
