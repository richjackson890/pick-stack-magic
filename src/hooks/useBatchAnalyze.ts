import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBatchAnalyze() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const analyzePending = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      toast({
        title: '분석할 항목 없음',
        description: '대기 중인 항목이 없습니다.',
      });
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: itemIds.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < itemIds.length; i++) {
      setProgress({ current: i + 1, total: itemIds.length });
      
      try {
        const { error } = await supabase.functions.invoke('analyze-content', {
          body: { item_id: itemIds[i], mode: 'light' },
        });

        if (error) {
          console.error(`Batch analyze error for ${itemIds[i]}:`, error);
          errorCount++;
        } else {
          successCount++;
        }

        // Small delay between requests to avoid rate limiting
        if (i < itemIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (e) {
        console.error(`Batch analyze failed for ${itemIds[i]}:`, e);
        errorCount++;
      }
    }

    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });

    toast({
      title: '일괄 분석 완료',
      description: `성공: ${successCount}개, 실패: ${errorCount}개`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    return { successCount, errorCount };
  }, [toast]);

  return {
    analyzePending,
    isProcessing,
    progress,
  };
}
