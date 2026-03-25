import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TipComment {
  id: string;
  tip_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export function useTipComments() {
  const { user } = useAuth();
  const [comments, setComments] = useState<TipComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const fetchComments = useCallback(async (tipId: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('tip_comments' as any)
        .select('*, profiles(name, avatar_url, email)')
        .eq('tip_id', tipId)
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('[useTipComments] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = async (tipId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;
    try {
      const { error } = await (supabase
        .from('tip_comments' as any)
        .insert({ tip_id: tipId, user_id: user.id, content: content.trim() }) as any);

      if (error) throw error;

      await fetchComments(tipId);
      setCommentCounts(prev => ({ ...prev, [tipId]: (prev[tipId] || 0) + 1 }));
      return true;
    } catch (err) {
      console.error('[useTipComments] add error:', err);
      return false;
    }
  };

  const deleteComment = async (commentId: string, tipId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from('tip_comments' as any)
        .delete()
        .eq('id', commentId) as any);

      if (error) throw error;

      await fetchComments(tipId);
      setCommentCounts(prev => ({ ...prev, [tipId]: Math.max(0, (prev[tipId] || 1) - 1) }));
      return true;
    } catch (err) {
      console.error('[useTipComments] delete error:', err);
      return false;
    }
  };

  const fetchCommentCount = useCallback(async (tipIds: string[]) => {
    if (tipIds.length === 0) return;
    try {
      const { data } = await (supabase
        .from('tip_comments' as any)
        .select('tip_id') as any);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => {
          counts[c.tip_id] = (counts[c.tip_id] || 0) + 1;
        });
        setCommentCounts(counts);
      }
    } catch (err) {
      console.error('[useTipComments] count error:', err);
    }
  }, []);

  const getCount = (tipId: string) => commentCounts[tipId] || 0;

  return { comments, loading, fetchComments, addComment, deleteComment, fetchCommentCount, getCount };
}
