import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'mention' | 'task_assignment' | 'task_acknowledged' | 'task_completed';
  tip_id: string | null;
  project_id?: string | null;
  from_user_id: string;
  message?: string | null;
  read: boolean;
  created_at: string;
  from_profile?: {
    name: string | null;
    display_name: string | null;
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
  const [newTaskAssignment, setNewTaskAssignment] = useState<Notification | null>(null);

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
    const tipIds = [...new Set(data.map((n: any) => n.tip_id).filter(Boolean))];

    const profilesRes = await (supabase.from('profiles' as any).select('id, name, display_name, avatar_url, email').in('id', fromUserIds) as any);
    const tipsRes = tipIds.length > 0
      ? await (supabase.from('tips' as any).select('id, title').in('id', tipIds) as any)
      : { data: [] };

    const profileMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => {
      profileMap[p.id] = { name: p.display_name || p.name, display_name: p.display_name, avatar_url: p.avatar_url, email: p.email };
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

  // Realtime subscription for instant task assignment notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload: any) => {
        const row = payload.new;
        if (row.type === 'task_assignment' || row.type === 'task_acknowledged' || row.type === 'task_completed') {
          // Enrich with profile
          const { data: profile } = await (supabase.from('profiles' as any)
            .select('id, name, display_name, avatar_url, email')
            .eq('id', row.from_user_id)
            .single() as any);
          const enriched: Notification = {
            ...row,
            from_profile: profile ? { name: profile.display_name || profile.name, display_name: profile.display_name, avatar_url: profile.avatar_url, email: profile.email } : undefined,
          };
          if (row.type === 'task_assignment') {
            setNewTaskAssignment(enriched);
          }
          fetchNotifications();
        } else {
          fetchNotifications();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const dismissTaskAssignment = () => setNewTaskAssignment(null);

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
    type: 'comment' | 'like' | 'mention',
    tipId: string,
    message?: string,
  ) => {
    if (!user || user.id === targetUserId) return;

    const payload = {
      user_id: targetUserId,
      type,
      tip_id: tipId,
      from_user_id: user.id,
      read: false,
      ...(message ? { message } : {}),
    };
    console.log('[notification] inserting:', payload);
    const { data, error } = await (supabase
      .from('notifications' as any)
      .insert(payload)
      .select() as any);
    if (error) console.error('[notification] insert error:', error);
    else console.log('[notification] insert ok:', data);
  };

  return {
    notifications,
    unreadCount,
    newTaskAssignment,
    dismissTaskAssignment,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
}
