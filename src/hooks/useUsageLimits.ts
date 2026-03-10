import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Free tier limits
export const FREE_LIMITS = {
  MAX_ITEMS: 50,
  MAX_AI_ANALYSIS_PER_MONTH: 10,
  MAX_IDEA_GENERATION_PER_MONTH: 3,
  MAX_DRAFT_GENERATION_PER_MONTH: 2,
} as const;

export interface UsageData {
  isPremium: boolean;
  itemsCount: number;
  aiAnalysisCount: number;
  ideaGenerationCount: number;
  draftGenerationCount: number;
  monthlyResetAt: string | null;
}

export interface UsageLimits {
  canSaveItem: boolean;
  canUseAiAnalysis: boolean;
  canUseDraftGeneration: boolean;
  itemsRemaining: number;
  aiAnalysisRemaining: number;
  draftGenerationRemaining: number;
  usageData: UsageData;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUsageLimits(): UsageLimits {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData>({
    isPremium: false,
    itemsCount: 0,
    aiAnalysisCount: 0,
    ideaGenerationCount: 0,
    draftGenerationCount: 0,
    monthlyResetAt: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageData({
        isPremium: false,
        itemsCount: 0,
        aiAnalysisCount: 0,
        ideaGenerationCount: 0,
        draftGenerationCount: 0,
        monthlyResetAt: null,
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, items_count, ai_analysis_count, idea_generation_count, draft_generation_count, monthly_reset_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setUsageData({
        isPremium: data?.is_premium ?? false,
        itemsCount: data?.items_count ?? 0,
        aiAnalysisCount: data?.ai_analysis_count ?? 0,
        ideaGenerationCount: (data as any)?.idea_generation_count ?? 0,
        monthlyResetAt: data?.monthly_reset_at ?? null,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Calculate remaining limits
  const itemsRemaining = usageData.isPremium 
    ? Infinity 
    : Math.max(0, FREE_LIMITS.MAX_ITEMS - usageData.itemsCount);
  
  const aiAnalysisRemaining = usageData.isPremium 
    ? Infinity 
    : Math.max(0, FREE_LIMITS.MAX_AI_ANALYSIS_PER_MONTH - usageData.aiAnalysisCount);

  return {
    canSaveItem: usageData.isPremium || usageData.itemsCount < FREE_LIMITS.MAX_ITEMS,
    canUseAiAnalysis: usageData.isPremium || usageData.aiAnalysisCount < FREE_LIMITS.MAX_AI_ANALYSIS_PER_MONTH,
    itemsRemaining,
    aiAnalysisRemaining,
    usageData,
    loading,
    refetch: fetchUsage,
  };
}
