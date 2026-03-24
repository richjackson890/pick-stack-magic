import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArchiCategory } from '@/hooks/useArchiCategories';

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
      const categoryData = categories.map(c => ({
        id: c.id,
        name: c.name,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('preview-analyze', {
        body: { url, categories: categoryData },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.success) {
        setPreview({
          title: data.title || '',
          description: (data.summary_3 || []).filter(Boolean).join(' '),
          image: data.thumbnail_url || '',
          tags: data.tags || [],
          suggestedCategory: data.final_category || '기타',
        });
      } else {
        throw new Error(data?.error || 'Preview failed');
      }
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
