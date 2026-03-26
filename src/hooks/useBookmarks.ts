import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    const { data } = await (supabase
      .from('bookmarks' as any)
      .select('tip_id')
      .eq('user_id', user.id) as any);

    if (data) {
      setBookmarkedIds(new Set(data.map((b: any) => b.tip_id)));
    }
  }, [user]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = async (tipId: string) => {
    if (!user) return;

    const { data: existing } = await (supabase
      .from('bookmarks' as any)
      .select('id')
      .eq('tip_id', tipId)
      .eq('user_id', user.id)
      .maybeSingle() as any);

    if (existing) {
      await (supabase.from('bookmarks' as any)
        .delete()
        .eq('tip_id', tipId)
        .eq('user_id', user.id) as any);

      setBookmarkedIds(prev => { const next = new Set(prev); next.delete(tipId); return next; });
    } else {
      await (supabase.from('bookmarks' as any)
        .insert({ tip_id: tipId, user_id: user.id }) as any);

      setBookmarkedIds(prev => new Set(prev).add(tipId));
    }
  };

  const isBookmarked = (tipId: string) => bookmarkedIds.has(tipId);

  return { toggleBookmark, isBookmarked, bookmarkedIds, fetchBookmarks };
}
