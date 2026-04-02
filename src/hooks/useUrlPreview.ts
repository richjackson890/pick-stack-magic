import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { callGroq, parseJsonFromLLM } from '@/lib/groqClient';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export interface UrlPreview {
  title: string;
  description: string;
  image: string;
  tags: string[];
  suggestedCategory: string; // category name
}

export function useUrlPreview() {
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async (url: string, categories: ArchiCategory[]) => {
    if (!url || !url.startsWith('http')) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      console.log('[useUrlPreview] Fetching preview for:', url);
      const categoryData = categories.map(c => ({
        id: c.id,
        name: c.name,
      }));

      // Step 1: Get basic metadata from Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('preview-analyze', {
        body: { url, categories: categoryData },
      });

      console.log('[useUrlPreview] Edge Function response:', { data, fnError });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Preview failed');

      let title = data.title || '';
      let description = (data.summary_3 || []).filter(Boolean).join(' ');
      let tags: string[] = data.tags || [];
      let suggestedCategory = data.final_category || '기타';
      let image = data.thumbnail_url || '';
      const platform = data.platform || 'Web';

      // YouTube thumbnail: always use hqdefault.jpg (guaranteed to exist)
      if (platform === 'YouTube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
          image = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      // Step 2: If Edge Function returned empty AI data, use client-side Groq
      const hasAiData = description.trim().length > 0 && tags.length > 0;
      if (!hasAiData) {
        console.log('[useUrlPreview] Edge Function AI data empty, calling Groq...');
        try {
          const categoryNames = categories.map(c => c.name).join(', ');
          const prompt = `URL 콘텐츠를 분석해주세요.

URL: ${url}
플랫폼: ${platform}
제목: ${title || '(없음)'}

카테고리 분류 기준 (반드시 아래 6개 중 하나로 분류):
- 구조/시공: 구조설계, 시공기술, 건축재료, 구조해석, 공법, 철골/RC/목구조
- AI/디지털: AI 건축 도구, 생성형 AI 활용, 디지털 설계 워크플로우, BIM 자동화, 파라메트릭 설계, Grasshopper, Dynamo, Revit, Rhino, Snaptrude, 3D모델링, 프로그래밍, 머신러닝 건축 응용, 다이어그램 자동화
- 디자인레퍼런스: 완성된 건축 작품 사례, 인테리어 디자인, 공간 디자인 사례, 건축가/스튜디오 작품, 디자인 트렌드, 조경, 파사드 디자인
- 법규검토: 건축법, 법규 해석, 인허가, 건폐율/용적률 규정, 피난규정, 소방법, 장애인편의시설, 조례
- 심사경향: 건축 공모전, 설계경기, 심사평, 수상작/당선작 분석, 공모전 출품 전략
- 기타: 위 5개 카테고리에 해당하지 않는 경우

중요: "도구", "소프트웨어", "모델링", "다이어그램", "프로그래밍", "자동화", "AI", "파라메트릭"이 포함된 콘텐츠는 "디자인레퍼런스"가 아니라 "AI/디지털"로 분류하세요.

태그 작성 규칙:
- 5~8개의 구체적이고 검색 가능한 키워드를 생성하세요
- 건축가가 실제로 검색할 용어를 사용하세요
- "AI", "건축", "자동화" 같은 너무 넓은 태그는 금지
- 구체적 도구명(Rhino, Revit, AutoCAD, Grasshopper, SketchUp, Enscape 등), 기법명(파라메트릭, 보로노이, 매스스터디 등), 프로젝트 유형(공동주택, 오피스텔, 문화시설 등), 전문 개념(건폐율, 용적률, 피난동선, 커튼월, BIM, LOD 등)을 우선 사용하세요
- 한국어와 영문 약어를 적절히 혼용하세요

다음 JSON만 응답하세요 (다른 텍스트 없이):
{
  "title": "명확한 제목 (원본 유지하거나 개선, 50자 이내)",
  "description": "콘텐츠 핵심 요약 2-3문장 (한국어)",
  "tags": ["구체적태그1", "구체적태그2", "구체적태그3", "구체적태그4", "구체적태그5", "구체적태그6", "구체적태그7"],
  "suggested_category": "AI/디지털 | 구조/시공 | 디자인레퍼런스 | 법규검토 | 심사경향 | 기타 중 하나"
}`;

          console.log('[useUrlPreview] Groq request prompt:', prompt.slice(0, 200));
          const raw = await callGroq([
            { role: 'system', content: '건축 분야 콘텐츠 분석 전문가. JSON으로만 응답.' },
            { role: 'user', content: prompt },
          ], { temperature: 0.3, max_tokens: 400 });

          console.log('[useUrlPreview] Groq raw response:', raw);

          const parsed = parseJsonFromLLM<{
            title?: string;
            description?: string;
            tags?: string[];
            suggested_category?: string;
          }>(raw);

          console.log('[useUrlPreview] Groq parsed:', parsed);

          if (parsed) {
            if (parsed.title) title = parsed.title;
            if (parsed.description) description = parsed.description;
            if (Array.isArray(parsed.tags) && parsed.tags.length > 0) tags = parsed.tags.slice(0, 8);
            if (parsed.suggested_category) suggestedCategory = parsed.suggested_category;
          }
        } catch (groqErr) {
          console.warn('[useUrlPreview] Groq fallback failed:', groqErr);
          // Continue with whatever data we have from Edge Function
        }
      }

      const previewData: UrlPreview = {
        title,
        description,
        image,
        tags,
        suggestedCategory,
      };
      console.log('[useUrlPreview] Final preview:', previewData);
      setPreview(previewData);

    } catch (err: any) {
      console.error('[useUrlPreview] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return { preview, loading, error, fetchPreview, clearPreview };
}
