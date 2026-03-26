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
  team_id: string | null;
  created_at: string;
  // AI analysis fields
  ai_summary: string | null;
  ai_tags: string[];
  ai_suggested_category: string | null;
  ai_status: 'pending' | 'processing' | 'done' | 'error' | null;
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
  team_id?: string | null;
};

export function useTips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTips = useCallback(async () => {
    try {
      // Fetch tips without join to avoid CORS issues with foreign table relations
      const { data, error } = await (supabase
        .from('tips' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      const rawTips: Tip[] = (data || []).map((tip: any) => ({
        ...tip,
        tags: tip.tags || [],
        likes: tip.likes || 0,
        ai_summary: tip.ai_summary || null,
        ai_tags: tip.ai_tags || [],
        ai_suggested_category: tip.ai_suggested_category || null,
        ai_status: tip.ai_status || null,
      }));

      // Fetch profiles separately for unique user_ids
      const userIds = [...new Set(rawTips.map(t => t.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase
          .from('profiles' as any)
          .select('id, name, avatar_url, email')
          .in('id', userIds) as any);

        if (profiles) {
          const profileMap: Record<string, Tip['profiles']> = {};
          profiles.forEach((p: any) => {
            profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url, email: p.email };
          });
          rawTips.forEach(tip => {
            tip.profiles = profileMap[tip.user_id];
          });
        }
      }

      setTips(rawTips);
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
          team_id: tip.team_id || null,
        })
        .select('*')
        .single() as any);

      if (error) throw error;

      // Fetch profile separately
      let profile: Tip['profiles'] | undefined;
      const { data: profileData } = await (supabase
        .from('profiles' as any)
        .select('id, name, avatar_url, email')
        .eq('id', user.id)
        .single() as any);
      if (profileData) {
        profile = { name: profileData.name, avatar_url: profileData.avatar_url, email: profileData.email };
      }

      const newTip: Tip = {
        ...data,
        tags: data.tags || [],
        likes: data.likes || 0,
        ai_summary: data.ai_summary || null,
        ai_tags: data.ai_tags || [],
        ai_suggested_category: data.ai_suggested_category || null,
        ai_status: data.ai_status || null,
        profiles: profile,
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
      console.log('[useTips] DELETE start - tip:', id, 'user:', user.id);

      // Step 1: Execute DELETE on Supabase FIRST, before touching local state
      const { error, status, statusText } = await (supabase
        .from('tips' as any)
        .delete()
        .eq('id', id) as any);

      console.log('[useTips] DELETE response:', { error, status, statusText });

      if (error) {
        console.error('[useTips] DELETE error:', JSON.stringify(error));
        throw error;
      }

      // Step 2: Only remove from local state AFTER successful DB delete
      setTips(prev => prev.filter(tip => tip.id !== id));
      console.log('[useTips] DELETE success, removed from local state');
      return true;
    } catch (error: any) {
      console.error('[useTips] DELETE failed:', error);
      toast({
        title: 'Failed to delete tip',
        description: error.message || 'Unknown error',
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
