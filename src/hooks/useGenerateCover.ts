import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateCoverParams {
  itemId: string;
  title: string;
  summary?: string;
  tags?: string[];
  categoryName?: string;
  platform?: string;
}

export function useGenerateCover() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCover = async ({
    itemId,
    title,
    summary,
    tags,
    categoryName,
    platform,
  }: GenerateCoverParams): Promise<string | null> => {
    setIsGenerating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await supabase.functions.invoke('generate-cover', {
        body: {
          item_id: itemId,
          title,
          summary,
          tags,
          category_name: categoryName,
          platform,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'AI 커버 생성에 실패했습니다.');
      }

      const data = response.data;

      if (data.error) {
        // Handle rate limit and credit errors
        if (data.error.includes('Rate limit')) {
          toast({
            title: '요청 한도 초과',
            description: '잠시 후 다시 시도해주세요.',
            variant: 'destructive',
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: '크레딧 부족',
            description: 'AI 크레딧을 충전해주세요.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error);
        }
        return null;
      }

      toast({
        title: 'AI 커버 생성 완료',
        description: '새로운 커버 이미지가 적용되었습니다.',
      });

      return data.thumbnail_url;
    } catch (error: any) {
      console.error('Generate cover error:', error);
      toast({
        title: 'AI 커버 생성 실패',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateCover,
    isGenerating,
  };
}
