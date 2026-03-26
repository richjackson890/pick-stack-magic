import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTipLikes() {
  const { user } = useAuth();
  const [likedTipIds, setLikedTipIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const fetchLikes = useCallback(async () => {
    if (!user) return;

    // Fetch user's likes
    const { data: userLikes } = await (supabase
      .from('tip_likes' as any)
      .select('tip_id')
      .eq('user_id', user.id) as any);

    if (userLikes) {
      setLikedTipIds(new Set(userLikes.map((l: any) => l.tip_id)));
    }
  }, [user]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const toggleLike = async (tipId: string): Promise<{ liked: boolean; count: number } | null> => {
    if (!user) return null;

    // DB에서 실제 좋아요 상태 확인 (로컬 상태와 DB 불일치 방지)
    const { data: existing } = await (supabase
      .from('tip_likes' as any)
      .select('id')
      .eq('tip_id', tipId)
      .eq('user_id', user.id)
      .maybeSingle() as any);

    if (existing) {
      // Unlike - DB에 좋아요가 있으므로 삭제
      await (supabase.from('tip_likes' as any)
        .delete()
        .eq('tip_id', tipId)
        .eq('user_id', user.id) as any);

      // Decrement likes count on tip
      try {
        await (supabase.rpc('decrement_likes' as any, { tip_id_input: tipId }) as any);
      } catch {
        // Fallback: direct update
        await (supabase.from('tips' as any).update({ likes: (likeCounts[tipId] || 1) - 1 }).eq('id', tipId) as any);
      }

      setLikedTipIds(prev => { const next = new Set(prev); next.delete(tipId); return next; });
      setLikeCounts(prev => ({ ...prev, [tipId]: Math.max(0, (prev[tipId] || 1) - 1) }));
      return { liked: false, count: Math.max(0, (likeCounts[tipId] || 1) - 1) };
    } else {
      // Like - DB에 좋아요가 없으므로 삽입
      await (supabase.from('tip_likes' as any)
        .insert({ tip_id: tipId, user_id: user.id }) as any);

      // Increment likes count on tip
      try {
        await (supabase.rpc('increment_likes' as any, { tip_id_input: tipId }) as any);
      } catch {
        // Fallback: direct update
        await (supabase.from('tips' as any).update({ likes: (likeCounts[tipId] || 0) + 1 }).eq('id', tipId) as any);
      }

      setLikedTipIds(prev => new Set(prev).add(tipId));
      setLikeCounts(prev => ({ ...prev, [tipId]: (prev[tipId] || 0) + 1 }));
      return { liked: true, count: (likeCounts[tipId] || 0) + 1 };
    }
  };

  const isLiked = (tipId: string) => likedTipIds.has(tipId);

  const setInitialCount = (tipId: string, count: number) => {
    setLikeCounts(prev => {
      if (prev[tipId] !== undefined) return prev;
      return { ...prev, [tipId]: count };
    });
  };

  const getCount = (tipId: string, fallback: number) => {
    return likeCounts[tipId] ?? fallback;
  };

  return { toggleLike, isLiked, setInitialCount, getCount, refetch: fetchLikes };
}
