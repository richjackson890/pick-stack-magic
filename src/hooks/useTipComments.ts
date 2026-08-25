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

  const fetchComments = useCallback(async (tipId: string) => {
    setLoading(true);
    try {
      // Fetch comments without join to avoid CORS issues
      const { data, error } = await (supabase
        .from('tip_comments' as any)
        .select('*')
        .eq('tip_id', tipId)
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;

      const rawComments: TipComment[] = data || [];

      // Fetch profiles separately
      const userIds = [...new Set(rawComments.map(c => c.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase
          .from('profiles' as any)
          .select('id, name, display_name, avatar_url, email')
          .in('id', userIds) as any);

        if (profiles) {
          const profileMap: Record<string, TipComment['profiles']> = {};
          profiles.forEach((p: any) => {
            profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url, email: p.email };
          });
          rawComments.forEach(c => {
            c.profiles = profileMap[c.user_id];
          });
        }
      }

      setComments(rawComments);
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
      return true;
    } catch (err) {
      console.error('[useTipComments] delete error:', err);
      return false;
    }
  };

  // Comment counts are no longer fetched here — they come embedded in the tips
  // query (useTips: `tip_comments(count)`). See Tip.comment_count.

  return { comments, loading, fetchComments, addComment, deleteComment };
}
