import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Clock, User, CheckCircle2, Circle, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember } from '@/hooks/useTeam';
import { cn } from '@/lib/utils';

interface TaskAssignment {
  id: string;
  project_id: string;
  task_id: string | null;
  instruction: string;
  due_date: string | null;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'acknowledged' | 'completed';
  created_at: string;
  assignee_profile?: { name: string | null; display_name: string | null; position: string | null };
  assigner_profile?: { name: string | null; display_name: string | null; position: string | null };
}

interface TaskDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  taskId?: string | null;
  taskTitle?: string | null;
  teamMembers: TeamMember[];
}

const getDisplayName = (p?: { display_name?: string | null; name?: string | null }) =>
  p?.display_name || p?.name || '?';

const STATUS_CONFIG = {
  pending: { label: '대기중', color: 'bg-gray-500/15 text-gray-500', icon: Circle },
  acknowledged: { label: '확인함', color: 'bg-blue-500/15 text-blue-500', icon: CheckCircle2 },
  completed: { label: '완료', color: 'bg-emerald-500/15 text-emerald-500', icon: CheckCheck },
};

export function TaskDetailPanel({
  isOpen,
  onClose,
  projectId,
  projectName,
  taskId,
  taskTitle,
  teamMembers,
}: TaskDetailPanelProps) {
  const { user } = useAuth();
  const [memo, setMemo] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoLoaded, setMemoLoaded] = useState(false);
  const memoFetchedRef = useRef<string | null>(null); // tracks which project/task combo we loaded

  // Assignment form
  const [instruction, setInstruction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Assignments list
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Fetch memo — only once when panel opens for a specific project/task
  const memoKey = `${projectId}:${taskId || 'project'}`;
  const prevMemoKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      // Reset when panel closes
      if (!isOpen) {
        prevMemoKeyRef.current = null;
        memoFetchedRef.current = null;
      }
      return;
    }
    // Only fetch if this is a new panel (different project/task) or first open
    if (memoFetchedRef.current === memoKey) return;
    memoFetchedRef.current = memoKey;
    prevMemoKeyRef.current = memoKey;
    setMemoLoaded(false);

    const fetchMemo = async () => {
      let query = supabase.from('task_notes' as any)
        .select('id, content, created_by')
        .eq('project_id', projectId);
      if (taskId) {
        query = query.eq('task_id', taskId);
      } else {
        query = query.is('task_id', null);
      }
      const { data } = await (query.maybeSingle() as any);
      // Only update state if we're still showing the same panel
      if (memoFetchedRef.current === memoKey) {
        setMemo(data?.content || '');
        setMemoLoaded(true);
      }
    };
    fetchMemo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, memoKey]);

  // Save memo (debounced on blur)
  const saveMemo = useCallback(async () => {
    if (!user || !memoLoaded) return;
    setMemoSaving(true);
    // Check if note exists for this project/task
    let existsQuery = supabase.from('task_notes' as any)
      .select('id')
      .eq('project_id', projectId);
    if (taskId) {
      existsQuery = existsQuery.eq('task_id', taskId);
    } else {
      existsQuery = existsQuery.is('task_id', null);
    }
    const { data: existing } = await (existsQuery.maybeSingle() as any);

    if (existing) {
      await (supabase.from('task_notes' as any).update({ content: memo }).eq('id', existing.id) as any);
    } else {
      await (supabase.from('task_notes' as any).insert({
        project_id: projectId,
        task_id: taskId || null,
        created_by: user.id,
        content: memo,
      }) as any);
    }
    setMemoSaving(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, projectId, taskId, memo, memoLoaded]);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    if (!isOpen) return;
    setLoadingAssignments(true);
    const query = taskId
      ? (supabase.from('task_assignments' as any).select('*').eq('task_id', taskId).order('created_at', { ascending: false }) as any)
      : (supabase.from('task_assignments' as any).select('*').eq('project_id', projectId).is('task_id', null).order('created_at', { ascending: false }) as any);
    const { data } = await query;
    const rows: TaskAssignment[] = data || [];

    // Enrich with profiles
    if (rows.length > 0) {
      const uids = [...new Set([...rows.map(r => r.assigned_to), ...rows.map(r => r.assigned_by)])];
      const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, display_name, position').in('id', uids) as any);
      const pMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { pMap[p.id] = p; });
      rows.forEach(r => {
        r.assignee_profile = pMap[r.assigned_to];
        r.assigner_profile = pMap[r.assigned_by];
      });
    }
    setAssignments(rows);
    setLoadingAssignments(false);
  }, [isOpen, projectId, taskId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // Create assignment
  const handleAssign = async () => {
    if (!user || !instruction.trim() || !assignTo) return;
    setAssigning(true);
    const payload: Record<string, any> = {
      project_id: projectId,
      task_id: taskId || null,
      instruction: instruction.trim(),
      due_date: dueDate || null,
      assigned_to: assignTo,
      assigned_by: user.id,
      status: 'pending',
    };

    console.log('[TaskPanel] inserting assignment:', payload);
    const { data: insertResult, error } = await (supabase.from('task_assignments' as any).insert(payload).select() as any);
    console.log('[TaskPanel] assignment result:', insertResult, 'error:', error);
    if (!error) {
      // Create notification for assigned user
      await (supabase.from('notifications' as any).insert({
        user_id: assignTo,
        type: 'task_assignment',
        from_user_id: user.id,
        tip_id: null,
        project_id: projectId,
        message: instruction.trim().slice(0, 100),
        read: false,
      }) as any);

      setInstruction('');
      setDueDate('');
      setAssignTo('');
      await fetchAssignments();
    }
    setAssigning(false);
  };

  // Update assignment status
  const updateStatus = async (assignmentId: string, newStatus: 'acknowledged' | 'completed', assignment: TaskAssignment) => {
    await (supabase.from('task_assignments' as any).update({ status: newStatus }).eq('id', assignmentId) as any);

    // Notify the assigner
    if (user) {
      await (supabase.from('notifications' as any).insert({
        user_id: assignment.assigned_by,
        type: newStatus === 'acknowledged' ? 'task_acknowledged' : 'task_completed',
        from_user_id: user.id,
        tip_id: null,
        project_id: projectId,
        message: newStatus === 'acknowledged' ? '업무를 확인했습니다' : '업무를 완료했습니다',
        read: false,
      }) as any);
    }
    await fetchAssignments();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-card border-l border-border/30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold truncate">{projectName}</h3>
                  {taskTitle && <p className="text-xs text-muted-foreground truncate">{taskTitle}</p>}
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Memo */}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                  메모
                  {memoSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  onBlur={saveMemo}
                  placeholder="자유 메모..."
                  className="w-full h-24 rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Assignment form */}
              <div className="space-y-2">
                <label className="text-[11px] text-muted-foreground font-medium">업무 지시</label>
                <Input
                  placeholder="지시 내용 (예: 사례조사 마무리해주세요)"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">담당자 선택</option>
                  {teamMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profiles?.position ? `${m.profiles.position} ` : ''}{getDisplayName(m.profiles)}
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  onClick={handleAssign}
                  disabled={!instruction.trim() || !assignTo || assigning}
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" />지시하기</>}
                </Button>
              </div>

              {/* Assignments list */}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
                  업무 지시 현황 ({assignments.length})
                </label>
                {loadingAssignments ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">아직 업무 지시가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map(a => {
                      const cfg = STATUS_CONFIG[a.status];
                      const StatusIcon = cfg.icon;
                      const isAssignee = user?.id === a.assigned_to;

                      return (
                        <div key={a.id} className="p-3 rounded-lg border border-border/30 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{a.instruction}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{getDisplayName(a.assigner_profile)} → {getDisplayName(a.assignee_profile)}</span>
                                {a.due_date && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {a.due_date}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0', cfg.color)}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </div>
                          {/* Action buttons for assignee */}
                          {isAssignee && a.status !== 'completed' && (
                            <div className="flex gap-2">
                              {a.status === 'pending' && (
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => updateStatus(a.id, 'acknowledged', a)}>
                                  확인
                                </Button>
                              )}
                              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => updateStatus(a.id, 'completed', a)}>
                                완료
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
