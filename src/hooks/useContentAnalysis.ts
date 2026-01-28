import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AiStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ContentAnalysisResult {
  success: boolean;
  error?: string;
}

export function useContentAnalysis() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});

  const analyzeContent = useCallback(async (itemId: string): Promise<ContentAnalysisResult> => {
    setAnalyzing(prev => ({ ...prev, [itemId]: true }));

    try {
      console.log('[useContentAnalysis] Starting analysis for:', itemId);

      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: itemId },
      });

      if (error) {
        console.error('[useContentAnalysis] Function error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[useContentAnalysis] Analysis complete:', data);
      return { success: true };
    } catch (error: any) {
      console.error('[useContentAnalysis] Error:', error);
      toast({
        title: '분석 실패',
        description: error.message || '콘텐츠 분석 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setAnalyzing(prev => ({ ...prev, [itemId]: false }));
    }
  }, [toast]);

  const isAnalyzing = useCallback((itemId: string) => {
    return analyzing[itemId] || false;
  }, [analyzing]);

  return {
    analyzeContent,
    isAnalyzing,
    analyzing,
  };
}
