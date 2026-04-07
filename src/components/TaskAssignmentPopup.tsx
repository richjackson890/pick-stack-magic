import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'task_popup_shown';

interface TaskAssignmentPopupProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export function TaskAssignmentPopup({ notifications, onMarkAsRead }: TaskAssignmentPopupProps) {
  const { user } = useAuth();
  const [pendingNotif, setPendingNotif] = useState<Notification | null>(null);

  useEffect(() => {
    const unreadTasks = notifications.filter(
      n => n.type === 'task_assignment' && !n.read
    );
    if (unreadTasks.length === 0) return;

    // Check which ones were already shown this session
    const shownRaw = sessionStorage.getItem(SESSION_KEY);
    const shownIds: string[] = shownRaw ? JSON.parse(shownRaw) : [];
    const unseen = unreadTasks.find(n => !shownIds.includes(n.id));

    if (unseen && !pendingNotif) {
      setPendingNotif(unseen);
      // Mark as shown in session
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([...shownIds, unseen.id]));
    }
  }, [notifications, pendingNotif]);

  const handleAcknowledge = async () => {
    if (!pendingNotif || !user) return;
    onMarkAsRead(pendingNotif.id);

    // Find and acknowledge the task_assignment
    if (pendingNotif.project_id) {
      const { data: assignments } = await (supabase.from('task_assignments' as any)
        .select('id')
        .eq('assigned_to', user.id)
        .eq('project_id', pendingNotif.project_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1) as any);

      if (assignments && assignments.length > 0) {
        await (supabase.from('task_assignments' as any)
          .update({ status: 'acknowledged' })
          .eq('id', assignments[0].id) as any);

        // Notify assigner
        await (supabase.from('notifications' as any).insert({
          user_id: pendingNotif.from_user_id,
          type: 'task_acknowledged',
          from_user_id: user.id,
          tip_id: null,
          project_id: pendingNotif.project_id,
          message: '업무를 확인했습니다',
          read: false,
        }) as any);
      }
    }
    setPendingNotif(null);
  };

  const handleDismiss = () => {
    setPendingNotif(null);
  };

  const fromName = pendingNotif?.from_profile?.display_name || pendingNotif?.from_profile?.name || 'Someone';

  return createPortal(
    <AnimatePresence>
      {pendingNotif && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="glass-card rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold">새 업무 지시가 있습니다</h3>
                <p className="text-xs text-muted-foreground">{fromName}님이 업무를 지시했습니다</p>
              </div>
            </div>

            {pendingNotif.message && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-sm font-medium">{pendingNotif.message}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                나중에
              </Button>
              <Button className="flex-1" onClick={handleAcknowledge}>
                확인했습니다
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
