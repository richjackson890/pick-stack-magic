import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  keywords: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export function useDbCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: '카테고리 로드 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category: { name: string; color: string; icon?: string; keywords?: string }) => {
    if (!user) return null;

    try {
      const maxSortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color,
          icon: category.icon || null,
          keywords: category.keywords || null,
          sort_order: maxSortOrder + 1,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: '카테고리 추가 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<DbCategory>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      return true;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: '카테고리 수정 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    try {
      // Get default category to move items to
      const defaultCategory = categories.find(c => c.is_default);
      
      // Move items to default category first
      if (defaultCategory) {
        await supabase
          .from('items')
          .update({ category_id: defaultCategory.id })
          .eq('category_id', id)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: '카테고리 삭제 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  const reorderCategories = async (newOrder: DbCategory[]) => {
    if (!user) return false;

    try {
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        keywords: cat.keywords,
        sort_order: index,
        is_default: cat.is_default,
      }));

      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }
      
      setCategories(newOrder.map((c, i) => ({ ...c, sort_order: i })));
      return true;
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      toast({
        title: '순서 변경 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getDefaultCategory = () => categories.find(c => c.is_default) || categories[categories.length - 1];

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryById,
    getDefaultCategory,
    refetch: fetchCategories,
  };
}
