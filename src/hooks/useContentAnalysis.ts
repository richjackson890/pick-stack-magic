import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AiStatus = 'pending' | 'processing' | 'done' | 'error';
export type AnalysisMode = 'light' | 'deep';

export interface ContentAnalysisResult {
  success: boolean;
  cached?: boolean;
  error?: string;
}

/**
 * Hook for triggering content analysis via Edge Function
 * This is the main entry point for starting AI analysis
 */
export function useContentAnalysis() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});

  /**
   * Start content analysis for a specific item
   * @param itemId - The ID of the item to analyze
   * @param mode - Analysis mode: 'light' (quick) or 'deep' (detailed)
   * @returns Analysis result with success status
   */
  const startContentAnalysis = useCallback(async (
    itemId: string, 
    mode: AnalysisMode = 'light'
  ): Promise<ContentAnalysisResult> => {
    setAnalyzing(prev => ({ ...prev, [itemId]: true }));

    try {
      console.log('[useContentAnalysis] Starting analysis for:', itemId, 'mode:', mode);

      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { item_id: itemId, mode },
      });

      if (error) {
        console.error('[useContentAnalysis] Function error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[useContentAnalysis] Analysis complete:', data);
      
      if (data?.cached) {
        return { success: true, cached: true };
      }
      
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

  /**
   * Trigger analysis for a newly saved item (auto-analysis)
   * This should be called immediately after inserting a new item
   */
  const triggerAutoAnalysis = useCallback(async (itemId: string): Promise<ContentAnalysisResult> => {
    console.log('[useContentAnalysis] Auto-triggering analysis for new item:', itemId);
    return startContentAnalysis(itemId, 'light');
  }, [startContentAnalysis]);

  const isAnalyzing = useCallback((itemId: string) => {
    return analyzing[itemId] || false;
  }, [analyzing]);

  return {
    startContentAnalysis,
    triggerAutoAnalysis,
    isAnalyzing,
    analyzing,
  };
}
