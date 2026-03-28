import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
}

export interface Project {
  id: string;
  name: string;
  type: string | null;
  deadline: string | null;
  status: string;
  created_by: string;
  members: { user_id: string; name: string | null; display_name: string | null; position: string | null }[];
  tasks: ProjectTask[];
}

export interface TeamEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  created_by: string;
}

export interface Leave {
  id: string;
  user_id: string;
  leave_date: string;
  type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차';
  profile?: { name: string | null; avatar_url: string | null };
}

export interface LeaveBalance {
  user_id: string;
  total_days: number;
  used_days: number;
  year?: number;
  profile?: { name: string | null; avatar_url: string | null };
}

export interface ProjectType {
  id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
}

export function useWorkDashboard(teamId: string | undefined) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range: this week Mon ~ next week Sun (14 days)
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 13);
    return {
      start: monday.toISOString().slice(0, 10),
      end: nextSunday.toISOString().slice(0, 10),
    };
  };

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const week = getWeekRange();
    console.log('[WorkDashboard] fetchAll - week:', week);

    try {
      // Projects (active)
      const { data: projectsData } = await (supabase
        .from('projects') as any)
        .select('*')
        .eq('created_by', user.id)
        .eq('status', '진행중')
        .order('created_at', { ascending: false }) as any;

      const rawProjects: Project[] = (projectsData || []).map((p: any) => ({ ...p, members: [], tasks: [] }));

      if (rawProjects.length > 0) {
        const projectIds = rawProjects.map(p => p.id);

        // Fetch project members + profiles
        const { data: membersData } = await (supabase
          .from('project_members' as any)
          .select('*')
          .in('project_id', projectIds) as any);

        if (membersData && membersData.length > 0) {
          const userIds = [...new Set(membersData.map((m: any) => m.user_id))];
          const { data: profiles } = await (supabase
            .from('profiles' as any)
            .select('id, name, display_name, position, avatar_url')
            .in('id', userIds) as any);

          const profileMap: Record<string, any> = {};
          (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

          rawProjects.forEach(proj => {
            proj.members = (membersData as any[])
              .filter((m: any) => m.project_id === proj.id)
              .map((m: any) => ({
                user_id: m.user_id,
                name: profileMap[m.user_id]?.display_name || profileMap[m.user_id]?.name || null,
                display_name: profileMap[m.user_id]?.display_name || null,
                position: profileMap[m.user_id]?.position || null,
              }));
          });
        }

        // Fetch project tasks
        const { data: tasksData } = await (supabase
          .from('project_tasks' as any)
          .select('*')
          .in('project_id', projectIds)
          .order('start_date') as any);

        if (tasksData && tasksData.length > 0) {
          rawProjects.forEach(proj => {
            proj.tasks = (tasksData as any[]).filter((t: any) => t.project_id === proj.id);
          });
        }
      }
      console.log('[WorkDashboard] fetched projects:', rawProjects.length);
      setProjects([...rawProjects]);

      // Events this week
      const eventQuery = (supabase.from('team_events' as any).select('*').eq('created_by', user.id).gte('event_date', week.start).lte('event_date', week.end).order('event_date') as any);
      const { data: eventsData } = await eventQuery;
      console.log('[WorkDashboard] fetched events:', (eventsData || []).length);
      setEvents([...(eventsData || [])]);

      // Leaves this week
      const leaveQuery = (supabase.from('leaves' as any).select('*').eq('user_id', user.id).gte('leave_date', week.start).lte('leave_date', week.end).order('leave_date') as any);
      const { data: leavesData } = await leaveQuery;

      const rawLeaves: Leave[] = leavesData || [];
      if (rawLeaves.length > 0) {
        const uids = [...new Set(rawLeaves.map(l => l.user_id))];
        const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, display_name, avatar_url').in('id', uids) as any);
        const pMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.name, avatar_url: p.avatar_url }; });
        rawLeaves.forEach(l => { l.profile = pMap[l.user_id]; });
      }
      console.log('[WorkDashboard] fetched leaves:', rawLeaves.length);
      setLeaves([...rawLeaves]);

      // Leave balances (current year)
      const currentYear = new Date().getFullYear();
      const { data: balData } = await (supabase.from('leave_balance' as any).select('*').eq('year', currentYear) as any);
      const rawBal: LeaveBalance[] = balData || [];
      if (rawBal.length > 0) {
        const uids = [...new Set(rawBal.map(b => b.user_id))];
        const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, display_name, avatar_url').in('id', uids) as any);
        const pMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.name, avatar_url: p.avatar_url }; });
        rawBal.forEach(b => { b.profile = pMap[b.user_id]; });
      }
      setBalances(rawBal);
      // Project types
      const { data: typesData } = await (supabase
        .from('project_types' as any)
        .select('*')
        .order('is_default', { ascending: false }) as any);
      setProjectTypes(typesData || []);

    } catch {
      // Silently handle — tables may not exist yet
    } finally {
      setLoading(false);
    }
  }, [user, teamId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Mutations
  const addProject = async (
    name: string,
    type?: string,
    memberIds?: string[],
    tasks?: { title: string; start_date: string; end_date: string }[],
  ) => {
    if (!user) return;
    const payload = {
      name,
      type: type?.trim() || null,
      deadline: null,
      status: '진행중',
      created_by: user.id,
    };
    console.log('[WorkDashboard] addProject payload:', payload);
    const { data, error } = await (supabase.from('projects' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addProject error:', error); return; }
    console.log('[WorkDashboard] addProject success:', data);

    // Add project members
    if (data && memberIds && memberIds.length > 0) {
      const rows = memberIds.map(uid => ({ project_id: data.id, user_id: uid }));
      await (supabase.from('project_members' as any).insert(rows) as any);
    }

    // Add project tasks
    if (data && tasks && tasks.length > 0) {
      const taskRows = tasks.map(t => ({
        project_id: data.id,
        title: t.title,
        start_date: t.start_date,
        end_date: t.end_date,
      }));
      const { error: taskError } = await (supabase.from('project_tasks' as any).insert(taskRows) as any);
      if (taskError) console.error('[WorkDashboard] addProjectTasks error:', taskError);
    }

    await fetchAll();
  };

  const addEvent = async (title: string, eventDate: string, eventTime?: string) => {
    if (!user) return;
    const payload = {
      title,
      event_date: eventDate,
      event_time: eventTime?.trim() || null,
      created_by: user.id,
    };
    console.log('[WorkDashboard] addEvent payload:', payload);
    const { data, error } = await (supabase.from('team_events' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addEvent error:', error); } else { console.log('[WorkDashboard] addEvent success:', data); }
    await fetchAll();
  };

  const leaveDeduction = (type: string): number => {
    if (type === '연차') return 1;
    if (type === '오전반차' || type === '오후반차') return 0.5;
    if (type === '오전반반차' || type === '오후반반차') return 0.25;
    return 0;
  };

  const addLeave = async (leaveDate: string, type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차', targetUserId?: string) => {
    if (!user) return;
    const uid = targetUserId || user.id;
    const payload = {
      user_id: uid,
      leave_date: leaveDate,
      type,
    };
    console.log('[WorkDashboard] addLeave payload:', payload);
    const { data, error } = await (supabase.from('leaves' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addLeave error:', error); return; }
    console.log('[WorkDashboard] addLeave success:', data);

    // Auto-deduct from leave_balance (only after successful insert)
    const deduction = leaveDeduction(type);
    if (deduction > 0) {
      const currentYear = new Date().getFullYear();
      const { data: bal, error: balFetchErr } = await (supabase.from('leave_balance' as any)
        .select('used_days')
        .eq('user_id', uid)
        .eq('year', currentYear)
        .single() as any);
      if (balFetchErr) {
        console.error('[WorkDashboard] addLeave - balance fetch error:', balFetchErr);
      } else if (bal) {
        const { error: balUpdateErr } = await (supabase.from('leave_balance' as any)
          .update({ used_days: bal.used_days + deduction })
          .eq('user_id', uid)
          .eq('year', currentYear) as any);
        if (balUpdateErr) console.error('[WorkDashboard] addLeave - balance update error:', balUpdateErr);
        else console.log('[WorkDashboard] addLeave - balance deducted:', deduction, 'new used_days:', bal.used_days + deduction);
      }
    }
    await fetchAll();
  };

  const updateProject = async (
    id: string,
    name: string,
    type?: string,
    memberIds?: string[],
    tasks?: { id?: string; title: string; start_date: string; end_date: string }[],
  ) => {
    console.log('[updateProject] id:', id, 'payload:', { name, type, memberIds, tasks });
    const { data, error } = await (supabase.from('projects' as any)
      .update({ name, type: type?.trim() || null })
      .eq('id', id)
      .select() as any);
    console.log('[updateProject] result:', data, error);
    if (error) { console.error('[WorkDashboard] updateProject error:', error); return; }

    // Update members: delete all then re-insert
    if (memberIds) {
      await (supabase.from('project_members' as any).delete().eq('project_id', id) as any);
      if (memberIds.length > 0) {
        const rows = memberIds.map(uid => ({ project_id: id, user_id: uid }));
        await (supabase.from('project_members' as any).insert(rows) as any);
      }
    }

    // Update tasks: delete all then re-insert
    if (tasks) {
      await (supabase.from('project_tasks' as any).delete().eq('project_id', id) as any);
      const validTasks = tasks.filter(t => t.title.trim() && t.start_date && t.end_date);
      if (validTasks.length > 0) {
        const rows = validTasks.map(t => ({ project_id: id, title: t.title, start_date: t.start_date, end_date: t.end_date }));
        await (supabase.from('project_tasks' as any).insert(rows) as any);
      }
    }
    await fetchAll();
  };

  const updateEvent = async (id: string, title: string, eventDate: string, eventTime?: string) => {
    console.log('[updateEvent] id:', id, 'payload:', { title, event_date: eventDate, event_time: eventTime?.trim() || null });
    const { data, error } = await (supabase.from('team_events' as any)
      .update({ title, event_date: eventDate, event_time: eventTime?.trim() || null })
      .eq('id', id)
      .select() as any);
    console.log('[updateEvent] result:', data, error);
    if (error) { console.error('[WorkDashboard] updateEvent error:', error); return; }
    await fetchAll();
  };

  const updateLeave = async (id: string, leaveDate: string, type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차') => {
    console.log('[updateLeave] id:', id, 'payload:', { leave_date: leaveDate, type });
    const { data, error } = await (supabase.from('leaves' as any)
      .update({ leave_date: leaveDate, type })
      .eq('id', id)
      .select() as any);
    console.log('[updateLeave] result:', data, error);
    if (error) { console.error('[WorkDashboard] updateLeave error:', error); return; }
    await fetchAll();
  };

  const deleteProject = async (id: string) => {
    // project_tasks cascade via FK, delete members + project
    await (supabase.from('project_members' as any).delete().eq('project_id', id) as any);
    const { error } = await (supabase.from('projects' as any).delete().eq('id', id) as any);
    if (error) { console.error('[WorkDashboard] deleteProject error:', error); return; }
    await fetchAll();
  };

  const deleteProjectTask = async (taskId: string) => {
    console.log('[deleteProjectTask] id:', taskId);
    const { data, error } = await (supabase.from('project_tasks' as any).delete().eq('id', taskId).select() as any);
    console.log('[deleteProjectTask] result:', data, error);
    if (error) { console.error('[WorkDashboard] deleteProjectTask error:', error); return; }
    await fetchAll();
  };

  const deleteEvent = async (id: string) => {
    console.log('[deleteEvent] id:', id);
    const { data, error } = await (supabase.from('team_events' as any).delete().eq('id', id).select() as any);
    console.log('[deleteEvent] result:', data, error);
    if (error) { console.error('[WorkDashboard] deleteEvent error:', error); return; }
    await fetchAll();
  };

  const deleteLeave = async (id: string) => {
    console.log('[deleteLeave] id:', id);
    // Fetch leave first to know type and user for balance restore
    const { data: leaveRow } = await (supabase.from('leaves' as any).select('user_id, type').eq('id', id).single() as any);
    const { data, error } = await (supabase.from('leaves' as any).delete().eq('id', id).select() as any);
    console.log('[deleteLeave] result:', data, error);
    if (error) { console.error('[WorkDashboard] deleteLeave error:', error); return; }

    // Restore leave_balance
    if (leaveRow) {
      const deduction = leaveDeduction(leaveRow.type);
      if (deduction > 0) {
        const currentYear = new Date().getFullYear();
        const { data: bal } = await (supabase.from('leave_balance' as any)
          .select('used_days')
          .eq('user_id', leaveRow.user_id)
          .eq('year', currentYear)
          .single() as any);
        if (bal) {
          await (supabase.from('leave_balance' as any)
            .update({ used_days: Math.max(0, bal.used_days - deduction) })
            .eq('user_id', leaveRow.user_id)
            .eq('year', currentYear) as any);
        }
      }
    }
    await fetchAll();
  };

  const addProjectType = async (name: string) => {
    if (!user || !name.trim()) return;
    await (supabase.from('project_types' as any).insert({ name: name.trim(), created_by: user.id }) as any);
    fetchAll();
  };

  const deleteProjectType = async (id: string) => {
    await (supabase.from('project_types' as any).delete().eq('id', id) as any);
    fetchAll();
  };

  const upsertLeaveBalance = async (totalDays: number, usedDays: number, targetUserId?: string) => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const uid = targetUserId || user.id;
    const payload = { user_id: uid, total_days: totalDays, used_days: usedDays, year: currentYear };
    console.log('[upsertLeaveBalance] payload:', payload);
    const { data, error } = await (supabase.from('leave_balance' as any)
      .upsert(payload, { onConflict: 'user_id,year' })
      .select() as any);
    console.log('[upsertLeaveBalance] result:', data, error);
    if (error) { console.error('[WorkDashboard] upsertLeaveBalance error:', error); return; }
    await fetchAll();
  };

  return {
    projects, events, leaves, balances, projectTypes, loading,
    addProject, addEvent, addLeave,
    updateProject, updateEvent, updateLeave,
    deleteProject, deleteEvent, deleteLeave, deleteProjectTask,
    addProjectType, deleteProjectType,
    upsertLeaveBalance,
    refetch: fetchAll,
  };
}
