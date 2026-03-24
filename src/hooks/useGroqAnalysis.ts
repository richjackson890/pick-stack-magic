import { useState, useCallback } from 'react';
import { callGroq, parseJsonFromLLM } from '@/lib/groqClient';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  summary: string;
  tags: string[];
  suggestedCategory: string;
}

export function useGroqAnalysis() {
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  const analyzeTip = useCallback(async (
    tip: Tip,
    categories: ArchiCategory[],
  ): Promise<AnalysisResult | null> => {
    // Don't re-analyze
    if (analyzingIds.has(tip.id)) return null;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[useGroqAnalysis] VITE_GROQ_API_KEY not set, skipping analysis');
      return null;
    }

    setAnalyzingIds(prev => new Set(prev).add(tip.id));

    // Mark as processing in DB
    await (supabase.from('tips' as any).update({ ai_status: 'processing' }).eq('id', tip.id) as any);

    try {
      const categoryNames = categories.map(c => c.name).join(', ');

      const prompt = `당신은 건축 분야 전문가입니다. 아래 건축 팁/자료를 분석해주세요.

제목: ${tip.title}
내용: ${tip.content || '(없음)'}
URL: ${tip.url || '(없음)'}
공모전/프로젝트명: ${tip.competition_name || '(없음)'}
사용자 태그: ${tip.tags?.join(', ') || '(없음)'}

카테고리 목록: ${categoryNames}

다음 JSON만 응답하세요 (다른 텍스트 없이):
{
  "summary": "2~3문장 한국어 요약 (건축 전문가 관점)",
  "tags": ["추천태그1", "추천태그2", "추천태그3", "추천태그4", "추천태그5"],
  "suggested_category": "위 카테고리 중 가장 적합한 하나"
}

태그는 한국어 건축 용어를 사용하세요 (예: 건폐율, 용적률, 피난동선, 커튼월, BIM, 친환경인증 등).`;

      const raw = await callGroq([
        { role: 'system', content: '건축 분야 지식 공유 분석 전문가. JSON으로만 응답.' },
        { role: 'user', content: prompt },
      ], { temperature: 0.3, max_tokens: 500 });

      const parsed = parseJsonFromLLM<{
        summary: string;
        tags: string[];
        suggested_category: string;
      }>(raw);

      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      const result: AnalysisResult = {
        summary: parsed.summary || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
        suggestedCategory: parsed.suggested_category || '기타',
      };

      // Save to DB
      await (supabase.from('tips' as any).update({
        ai_summary: result.summary,
        ai_tags: result.tags,
        ai_suggested_category: result.suggestedCategory,
        ai_status: 'done',
      }).eq('id', tip.id) as any);

      return result;
    } catch (err: any) {
      console.error('[useGroqAnalysis] Error:', err);
      await (supabase.from('tips' as any).update({ ai_status: 'error' }).eq('id', tip.id) as any);
      return null;
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(tip.id);
        return next;
      });
    }
  }, [analyzingIds]);

  return { analyzeTip, analyzingIds };
}
