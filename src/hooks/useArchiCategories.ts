import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ArchiCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function useArchiCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ArchiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await (supabase
        .from('categories' as any)
        .select('*')
        .order('name') as any);

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Failed to load categories',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryById = (id: string | null) => categories.find(c => c.id === id);
  const getDefaultCategory = () => categories.find(c => c.name === '기타') || categories[categories.length - 1];

  return {
    categories,
    loading,
    getCategoryById,
    getDefaultCategory,
    refetch: fetchCategories,
  };
}
