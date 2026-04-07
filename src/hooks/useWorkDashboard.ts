import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// KST 기준 오늘 날짜 (YYYY-MM-DD)
const getTodayKST = () => {
  const now = new Date();
  // toLocaleString으로 KST 기준 날짜 부분 추출 (브라우저 타임존 무관)
  const kstStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }); // sv-SE → YYYY-MM-DD
  return kstStr;
};

// KST 기준 현재 연도
const getYearKST = () => {
  return parseInt(getTodayKST().slice(0, 4), 10);
};

// KST 기준 Date를 YYYY-MM-DD로 변환
const toDateStrKST = (d: Date) => {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
};

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
  sort_order: number;
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
  type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차' | '외출';
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
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

export interface WeekSnapshot {
  id: string;
  week_start: string;
  week_end: string;
  snapshot: { projects: Project[]; events: TeamEvent[]; leaves: Leave[]; balances: LeaveBalance[] };
  created_at: string;
}

export function useWorkDashboard(teamId: string | undefined) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<WeekSnapshot[]>([]);
  const [viewingSnapshot, setViewingSnapshot] = useState<WeekSnapshot | null>(null);

  // Date range: this week Mon ~ next week Sun (14 days), KST
  const getWeekRange = () => {
    const today = getTodayKST();
    const d = new Date(today + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 13);
    const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return {
      start: fmt(monday),
      end: fmt(nextSunday),
    };
  };

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const week = getWeekRange();
    console.log('[WorkDashboard] fetchAll - week:', week);

    try {
      // Fetch team member user_ids
      let teamUserIds: string[] = [user.id];
      if (teamId) {
        const { data: tmRows } = await (supabase
          .from('team_members' as any)
          .select('user_id')
          .eq('team_id', teamId)
          .eq('status', 'active') as any);
        if (tmRows && tmRows.length > 0) {
          teamUserIds = [...new Set(tmRows.map((r: any) => r.user_id).filter(Boolean))];
        }
      }

      // Projects (active) — created by team OR assigned to team members
      const { data: projectsData } = await (supabase
        .from('projects') as any)
        .select('*')
        .in('created_by', teamUserIds)
        .eq('status', '진행중')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }) as any;

      // Also fetch projects where team members are assigned (not just creator)
      const { data: memberProjectRows } = await (supabase
        .from('project_members' as any)
        .select('project_id')
        .in('user_id', teamUserIds) as any);
      const memberProjectIds = [...new Set((memberProjectRows || []).map((r: any) => r.project_id))];

      // Fetch those projects that aren't already in projectsData
      const existingIds = new Set((projectsData || []).map((p: any) => p.id));
      const missingIds = memberProjectIds.filter((id: string) => !existingIds.has(id));
      let extraProjects: any[] = [];
      if (missingIds.length > 0) {
        const { data: extraData } = await (supabase
          .from('projects') as any)
          .select('*')
          .in('id', missingIds)
          .eq('status', '진행중') as any;
        extraProjects = extraData || [];
      }

      const rawProjects: Project[] = [...(projectsData || []), ...extraProjects].map((p: any) => ({ ...p, members: [], tasks: [] }));

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

      // Events for next 90 days — all team members
      const eventStart = getTodayKST();
      const eventEndDate = new Date(new Date(eventStart + 'T00:00:00').getTime() + 90 * 24 * 60 * 60 * 1000);
      const eventEnd = `${eventEndDate.getFullYear()}-${String(eventEndDate.getMonth() + 1).padStart(2, '0')}-${String(eventEndDate.getDate()).padStart(2, '0')}`;
      const eventQuery = (supabase.from('team_events' as any).select('*').in('created_by', teamUserIds).gte('event_date', eventStart).lte('event_date', eventEnd).order('event_date') as any);
      const { data: eventsData } = await eventQuery;
      console.log('[WorkDashboard] fetched events:', (eventsData || []).length);
      setEvents([...(eventsData || [])]);

      // Leaves — current year, all team members
      const currentYearStr = String(getYearKST());
      const leaveYearStart = `${currentYearStr}-01-01`;
      const leaveYearEnd = `${currentYearStr}-12-31`;
      const leaveQuery = (supabase.from('leaves' as any).select('*').in('user_id', teamUserIds).gte('leave_date', leaveYearStart).lte('leave_date', leaveYearEnd).order('leave_date') as any);
      const { data: leavesData } = await leaveQuery;

      const rawLeaves: Leave[] = leavesData || [];
      if (rawLeaves.length > 0) {
        const uids = [...new Set(rawLeaves.map(l => l.user_id))];
        const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, display_name, avatar_url').in('id', uids) as any);
        const pMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.display_name || p.name, avatar_url: p.avatar_url }; });
        rawLeaves.forEach(l => { l.profile = pMap[l.user_id]; });
      }
      console.log('[WorkDashboard] fetched leaves:', rawLeaves.length);
      setLeaves([...rawLeaves]);

      // Leave balances (current year) — all team members
      const currentYear = getYearKST();
      const { data: balData } = await (supabase.from('leave_balance' as any).select('*').in('user_id', teamUserIds).eq('year', currentYear) as any);
      const rawBal: LeaveBalance[] = balData || [];
      if (rawBal.length > 0) {
        const uids = [...new Set(rawBal.map(b => b.user_id))];
        const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, display_name, avatar_url').in('id', uids) as any);
        const pMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.display_name || p.name, avatar_url: p.avatar_url }; });
        rawBal.forEach(b => { b.profile = pMap[b.user_id]; });
      }
      setBalances(rawBal);
      // Project types
      const { data: typesData } = await (supabase
        .from('project_types' as any)
        .select('*')
        .order('is_default', { ascending: false }) as any);
      setProjectTypes(typesData || []);

      // Sync pending balance deductions (leave_date <= today AND not yet deducted) — team scope
      const todayStr = getTodayKST();
      const { data: pendingLeaves } = await (supabase.from('leaves' as any)
        .select('id, user_id, type')
        .in('user_id', teamUserIds)
        .eq('balance_deducted', false)
        .lte('leave_date', todayStr) as any);

      if (pendingLeaves && pendingLeaves.length > 0) {
        console.log('[WorkDashboard] syncing pending deductions:', pendingLeaves.length);
        for (const pl of pendingLeaves) {
          const ded = leaveDeduction(pl.type);
          if (ded > 0) {
            const yr = getYearKST();
            const { data: bal } = await (supabase.from('leave_balance' as any)
              .select('used_days').eq('user_id', pl.user_id).eq('year', yr).single() as any);
            if (bal) {
              await (supabase.from('leave_balance' as any)
                .update({ used_days: bal.used_days + ded }).eq('user_id', pl.user_id).eq('year', yr) as any);
            }
          }
          await (supabase.from('leaves' as any).update({ balance_deducted: true }).eq('id', pl.id) as any);
        }
      }

    } catch {
      // Silently handle — tables may not exist yet
    } finally {
      setLoading(false);
    }
  }, [user, teamId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Resolve team_id from hook parameter or query team_members
  const resolveTeamId = async (): Promise<string | null> => {
    if (teamId) return teamId;
    if (!user) return null;
    const { data: tmRow } = await (supabase
      .from('team_members' as any)
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle() as any);
    return tmRow?.team_id || null;
  };

  // Mutations
  const addProject = async (
    name: string,
    type?: string,
    memberIds?: string[],
    tasks?: { title: string; start_date: string; end_date: string }[],
  ) => {
    if (!user) return;
    const resolvedTeamId = await resolveTeamId();
    const payload: Record<string, any> = {
      name,
      type: type?.trim() || null,
      deadline: null,
      status: '진행중',
      created_by: user.id,
    };
    if (resolvedTeamId) payload.team_id = resolvedTeamId;
    console.log('[WorkDashboard] addProject payload:', payload);
    const { data, error } = await (supabase.from('projects' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addProject error:', error); return; }
    console.log('[WorkDashboard] addProject success:', data);

    // Add project members (upsert to avoid 409 conflict)
    if (data && memberIds && memberIds.length > 0) {
      const rows = memberIds.map(uid => ({ project_id: data.id, user_id: uid }));
      await (supabase.from('project_members' as any).upsert(rows, { onConflict: 'project_id,user_id' }) as any);
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
    const resolvedTeamId = await resolveTeamId();
    const payload: Record<string, any> = {
      title,
      event_date: eventDate,
      event_time: eventTime?.trim() || null,
      created_by: user.id,
    };
    if (resolvedTeamId) payload.a_id = resolvedTeamId;
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

  const deductBalance = async (uid: string, type: string) => {
    const deduction = leaveDeduction(type);
    if (deduction <= 0) return;
    const currentYear = getYearKST();
    const { data: bal, error: balFetchErr } = await (supabase.from('leave_balance' as any)
      .select('used_days').eq('user_id', uid).eq('year', currentYear).single() as any);
    if (balFetchErr) { console.error('[deductBalance] fetch error:', balFetchErr); return; }
    if (!bal) return;
    const { error: balUpdateErr } = await (supabase.from('leave_balance' as any)
      .update({ used_days: bal.used_days + deduction }).eq('user_id', uid).eq('year', currentYear) as any);
    if (balUpdateErr) console.error('[deductBalance] update error:', balUpdateErr);
    else console.log('[deductBalance] deducted:', deduction, 'new used_days:', bal.used_days + deduction);
  };

  const addLeave = async (
    leaveDate: string,
    type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차' | '외출',
    targetUserId?: string,
    extra?: { start_time?: string; end_time?: string; reason?: string },
  ) => {
    if (!user) return;
    const uid = targetUserId || user.id;
    const todayKST = getTodayKST();
    const shouldDeduct = type !== '외출' && leaveDate <= todayKST;
    const resolvedTeamId = await resolveTeamId();
    const payload: Record<string, any> = {
      user_id: uid,
      leave_date: leaveDate,
      type,
      balance_deducted: shouldDeduct,
    };
    if (extra?.start_time) payload.start_time = extra.start_time;
    if (extra?.end_time) payload.end_time = extra.end_time;
    if (extra?.reason) payload.reason = extra.reason;
    if (resolvedTeamId) payload.team_id = resolvedTeamId;
    console.log('[WorkDashboard] addLeave payload:', payload);
    const { data, error } = await (supabase.from('leaves' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addLeave error:', error); return; }
    console.log('[WorkDashboard] addLeave success:', data);

    if (shouldDeduct) {
      await deductBalance(uid, type);
    } else {
      console.log('[WorkDashboard] addLeave - future date, deduction deferred');
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

    // Update members: upsert new, delete removed
    if (memberIds) {
      // Delete members no longer in the list
      await (supabase.from('project_members' as any).delete().eq('project_id', id) as any);
      if (memberIds.length > 0) {
        const rows = memberIds.map(uid => ({ project_id: id, user_id: uid }));
        await (supabase.from('project_members' as any).upsert(rows, { onConflict: 'project_id,user_id' }) as any);
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

  const updateLeave = async (
    id: string,
    leaveDate: string,
    type: '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차' | '외출',
    extra?: { start_time?: string; end_time?: string; reason?: string },
  ) => {
    const updatePayload: Record<string, any> = { leave_date: leaveDate, type };
    if (type === '외출') {
      updatePayload.start_time = extra?.start_time || null;
      updatePayload.end_time = extra?.end_time || null;
      updatePayload.reason = extra?.reason || null;
    } else {
      updatePayload.start_time = null;
      updatePayload.end_time = null;
      updatePayload.reason = null;
    }
    console.log('[updateLeave] id:', id, 'payload:', updatePayload);
    const { data, error } = await (supabase.from('leaves' as any)
      .update(updatePayload)
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
    // Fetch leave first to know type, user, and deduction status
    const { data: leaveRow } = await (supabase.from('leaves' as any).select('user_id, type, balance_deducted').eq('id', id).single() as any);
    const { data, error } = await (supabase.from('leaves' as any).delete().eq('id', id).select() as any);
    console.log('[deleteLeave] result:', data, error);
    if (error) { console.error('[WorkDashboard] deleteLeave error:', error); return; }

    // Restore leave_balance only if it was already deducted
    if (leaveRow && leaveRow.balance_deducted) {
      const deduction = leaveDeduction(leaveRow.type);
      if (deduction > 0) {
        const currentYear = getYearKST();
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
          console.log('[deleteLeave] balance restored:', deduction);
        }
      }
    }
    await fetchAll();
  };

  const addProjectType = async (name: string) => {
    if (!user || !name.trim()) return;
    await (supabase.from('project_types' as any).insert({ name: name.trim(), created_by: user.id }) as any);
    await fetchAll();
  };

  const deleteProjectType = async (id: string) => {
    await (supabase.from('project_types' as any).delete().eq('id', id) as any);
    await fetchAll();
  };

  const upsertLeaveBalance = async (totalDays: number, usedDays: number, targetUserId?: string) => {
    if (!user) return;
    const currentYear = getYearKST();
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

  // --- Weekly snapshot ---
  const getMonday = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay();
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  // Auto-save last week's snapshot — 최초 로드 시 1회만 실행
  const snapshotSaved = useRef(false);
  useEffect(() => {
    if (!user || loading || snapshotSaved.current) return;
    snapshotSaved.current = true;

    const fmtDate = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const todayDate = new Date(getTodayKST() + 'T00:00:00');
    const thisMonday = getMonday(todayDate);
    const thisMondayStr = fmtDate(thisMonday);

    // localStorage 체크: 이미 이번 주에 저장했으면 스킵
    const lastSaved = localStorage.getItem(`snapshot_week_${user.id}`);
    if (lastSaved && lastSaved >= thisMondayStr) return;

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastMondayStr = fmtDate(lastMonday);
    const lastFriday = new Date(lastMonday);
    lastFriday.setDate(lastMonday.getDate() + 4);
    const lastFridayStr = fmtDate(lastFriday);

    if (projects.length === 0 && events.length === 0 && leaves.length === 0) return;

    (async () => {
      // DB에서 해당 week_start 레코드가 이미 있는지 확인
      const { data: existing } = await (supabase.from('weekly_snapshots' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', lastMondayStr)
        .maybeSingle() as any);

      if (existing) {
        // 이미 저장됨 → localStorage만 갱신하고 스킵
        localStorage.setItem(`snapshot_week_${user.id}`, thisMondayStr);
        console.log('[snapshot] already exists, skipped');
        return;
      }

      // 없을 때만 INSERT
      const snap = { projects, events, leaves, balances };
      const { error } = await (supabase.from('weekly_snapshots' as any).insert({
        user_id: user.id,
        week_start: lastMondayStr,
        week_end: lastFridayStr,
        snapshot: snap,
      }) as any);

      if (!error) {
        localStorage.setItem(`snapshot_week_${user.id}`, thisMondayStr);
        console.log('[snapshot] saved last week');
      } else {
        // 실패 시에도 localStorage 기록하여 무한 재시도 방지
        localStorage.setItem(`snapshot_week_${user.id}`, thisMondayStr);
        console.error('[snapshot] save failed:', error);
      }
    })();
  }, [user, loading]);

  // Fetch snapshot list
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from('weekly_snapshots' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(12) as any);
      setSnapshots(data || []);
    })();
  }, [user, loading]);

  const viewSnapshot = (snap: WeekSnapshot | null) => setViewingSnapshot(snap);

  const updateProjectOrder = async (orderedIds: string[]) => {
    // Optimistically update local state
    const reordered = orderedIds
      .map((id, idx) => {
        const p = projects.find(pr => pr.id === id);
        return p ? { ...p, sort_order: idx } : null;
      })
      .filter(Boolean) as Project[];
    setProjects(reordered);

    // Persist to Supabase
    const updates = orderedIds.map((id, idx) =>
      (supabase.from('projects' as any).update({ sort_order: idx }).eq('id', id) as any)
    );
    await Promise.all(updates);
  };

  return {
    projects: viewingSnapshot ? viewingSnapshot.snapshot.projects : projects,
    events: viewingSnapshot ? viewingSnapshot.snapshot.events : events,
    leaves: viewingSnapshot ? viewingSnapshot.snapshot.leaves : leaves,
    balances: viewingSnapshot ? viewingSnapshot.snapshot.balances : balances,
    projectTypes, loading,
    addProject, addEvent, addLeave,
    updateProject, updateEvent, updateLeave,
    deleteProject, deleteEvent, deleteLeave, deleteProjectTask,
    addProjectType, deleteProjectType,
    upsertLeaveBalance,
    refetch: fetchAll,
    updateProjectOrder,
    snapshots, viewingSnapshot, viewSnapshot,
  };
}
