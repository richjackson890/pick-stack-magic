import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like';
  tip_id: string;
  from_user_id: string;
  read: boolean;
  created_at: string;
  from_profile?: {
    name: string | null;
    avatar_url: string | null;
    email: string;
  };
  tip?: {
    title: string;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    // Fetch notifications without joins to avoid CORS issues
    const { data } = await (supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20) as any);

    if (!data || data.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch related profiles and tips separately
    const fromUserIds = [...new Set(data.map((n: any) => n.from_user_id))];
    const tipIds = [...new Set(data.map((n: any) => n.tip_id))];

    const [profilesRes, tipsRes] = await Promise.all([
      (supabase.from('profiles' as any).select('id, name, avatar_url, email').in('id', fromUserIds) as any),
      (supabase.from('tips' as any).select('id, title').in('id', tipIds) as any),
    ]);

    const profileMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => {
      profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url, email: p.email };
    });

    const tipMap: Record<string, any> = {};
    (tipsRes.data || []).forEach((t: any) => {
      tipMap[t.id] = { title: t.title };
    });

    const enriched = data.map((n: any) => ({
      ...n,
      from_profile: profileMap[n.from_user_id],
      tip: tipMap[n.tip_id],
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter((n: any) => !n.read).length);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Poll every 30s for new notifications
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await (supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('id', id) as any);

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await (supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false) as any);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const createNotification = async (
    targetUserId: string,
    type: 'comment' | 'like',
    tipId: string,
  ) => {
    if (!user || user.id === targetUserId) return;

    await (supabase
      .from('notifications' as any)
      .insert({
        user_id: targetUserId,
        type,
        tip_id: tipId,
        from_user_id: user.id,
      }) as any);
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
}
