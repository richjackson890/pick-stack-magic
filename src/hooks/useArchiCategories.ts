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

  const addCategory = async (name: string, icon: string, color: string): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from('categories' as any)
        .insert({ name: name.trim(), icon, color })
        .select() as any);
      if (error) throw error;
      await fetchCategories();
      toast({ title: `카테고리 "${name}" 추가됨` });
      return true;
    } catch (err: any) {
      toast({ title: '카테고리 추가 실패', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const updateCategory = async (id: string, updates: { name?: string; icon?: string; color?: string }): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from('categories' as any)
        .update(updates)
        .eq('id', id) as any);
      if (error) throw error;
      await fetchCategories();
      toast({ title: '카테고리 수정됨' });
      return true;
    } catch (err: any) {
      toast({ title: '카테고리 수정 실패', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Check if any tips use this category
      const { count } = await (supabase
        .from('tips' as any)
        .select('id', { count: 'exact', head: true })
        .eq('category', id) as any);
      if (count && count > 0) {
        toast({ title: '삭제 불가', description: `${count}개의 팁이 이 카테고리를 사용 중입니다.`, variant: 'destructive' });
        return false;
      }
      const { error } = await (supabase
        .from('categories' as any)
        .delete()
        .eq('id', id) as any);
      if (error) throw error;
      await fetchCategories();
      toast({ title: '카테고리 삭제됨' });
      return true;
    } catch (err: any) {
      toast({ title: '카테고리 삭제 실패', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    categories,
    loading,
    getCategoryById,
    getDefaultCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
