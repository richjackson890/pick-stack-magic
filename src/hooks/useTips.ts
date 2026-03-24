import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Tip {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  url: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  competition_name: string | null;
  likes: number;
  created_at: string;
  // Joined profile data
  profiles?: {
    name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export type TipInsert = {
  title: string;
  content?: string;
  url?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  competition_name?: string;
};

export function useTips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTips = useCallback(async () => {
    try {
      const { data, error } = await (supabase
        .from('tips' as any)
        .select('*, profiles(name, avatar_url, email)')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      setTips((data || []).map((tip: any) => ({
        ...tip,
        tags: tip.tags || [],
        likes: tip.likes || 0,
      })));
    } catch (error: any) {
      console.error('Error fetching tips:', error);
      toast({
        title: 'Failed to load tips',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const addTip = async (tip: TipInsert): Promise<Tip | null> => {
    if (!user) return null;

    try {
      const { data, error } = await (supabase
        .from('tips' as any)
        .insert({
          user_id: user.id,
          title: tip.title,
          content: tip.content || null,
          url: tip.url || null,
          image_url: tip.image_url || null,
          category: tip.category || null,
          tags: tip.tags || [],
          competition_name: tip.competition_name || null,
        })
        .select('*, profiles(name, avatar_url, email)')
        .single() as any);

      if (error) throw error;

      const newTip: Tip = {
        ...data,
        tags: data.tags || [],
        likes: data.likes || 0,
      };

      setTips(prev => [newTip, ...prev]);
      return newTip;
    } catch (error: any) {
      console.error('Error adding tip:', error);
      toast({
        title: 'Failed to save tip',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTip = async (id: string, updates: Partial<TipInsert>) => {
    if (!user) return false;

    try {
      const { error } = await (supabase
        .from('tips' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) as any);

      if (error) throw error;

      setTips(prev => prev.map(tip => tip.id === id ? { ...tip, ...updates } : tip));
      return true;
    } catch (error: any) {
      console.error('Error updating tip:', error);
      toast({
        title: 'Failed to update tip',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTip = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase
        .from('tips' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) as any);

      if (error) throw error;

      setTips(prev => prev.filter(tip => tip.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting tip:', error);
      toast({
        title: 'Failed to delete tip',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    tips,
    loading,
    addTip,
    updateTip,
    deleteTip,
    refetch: fetchTips,
  };
}
