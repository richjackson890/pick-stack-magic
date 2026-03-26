import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Project {
  id: string;
  name: string;
  type: string | null;
  deadline: string | null;
  status: string;
  created_by: string;
  members: { user_id: string; name: string | null; avatar_url: string | null }[];
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
  type: '연차' | '반차' | '병가' | '기타';
  profile?: { name: string | null; avatar_url: string | null };
}

export interface LeaveBalance {
  user_id: string;
  total_days: number;
  used_days: number;
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
      const projectQuery = (supabase.from('projects' as any).select('*').eq('created_by', user.id).eq('status', 'active').order('deadline') as any);
      const { data: projectsData } = await projectQuery;

      const rawProjects: Project[] = (projectsData || []).map((p: any) => ({ ...p, members: [] }));

      // Fetch project members + profiles
      if (rawProjects.length > 0) {
        const projectIds = rawProjects.map(p => p.id);
        const { data: membersData } = await (supabase
          .from('project_members' as any)
          .select('*')
          .in('project_id', projectIds) as any);

        if (membersData && membersData.length > 0) {
          const userIds = [...new Set(membersData.map((m: any) => m.user_id))];
          const { data: profiles } = await (supabase
            .from('profiles' as any)
            .select('id, name, avatar_url')
            .in('id', userIds) as any);

          const profileMap: Record<string, any> = {};
          (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

          rawProjects.forEach(proj => {
            proj.members = (membersData as any[])
              .filter((m: any) => m.project_id === proj.id)
              .map((m: any) => ({
                user_id: m.user_id,
                name: profileMap[m.user_id]?.name || null,
                avatar_url: profileMap[m.user_id]?.avatar_url || null,
              }));
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
        const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, avatar_url').in('id', uids) as any);
        const pMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.name, avatar_url: p.avatar_url }; });
        rawLeaves.forEach(l => { l.profile = pMap[l.user_id]; });
      }
      console.log('[WorkDashboard] fetched leaves:', rawLeaves.length);
      setLeaves([...rawLeaves]);

      // Leave balances (team)
      if (teamId) {
        const { data: balData } = await (supabase.from('leave_balance' as any).select('*') as any);
        const rawBal: LeaveBalance[] = balData || [];
        if (rawBal.length > 0) {
          const uids = [...new Set(rawBal.map(b => b.user_id))];
          const { data: profiles } = await (supabase.from('profiles' as any).select('id, name, avatar_url').in('id', uids) as any);
          const pMap: Record<string, any> = {};
          (profiles || []).forEach((p: any) => { pMap[p.id] = { name: p.name, avatar_url: p.avatar_url }; });
          rawBal.forEach(b => { b.profile = pMap[b.user_id]; });
        }
        setBalances(rawBal);
      }
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
  const addProject = async (name: string, type?: string, deadline?: string, memberIds?: string[]) => {
    if (!user) return;
    const payload = {
      name,
      type: type?.trim() || null,
      deadline: deadline?.trim() || null,
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

  const addLeave = async (leaveDate: string, type: '연차' | '반차' | '병가' | '기타') => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      leave_date: leaveDate,
      type,
    };
    console.log('[WorkDashboard] addLeave payload:', payload);
    const { data, error } = await (supabase.from('leaves' as any).insert(payload).select('id').single() as any);
    if (error) { console.error('[WorkDashboard] addLeave error:', error); } else { console.log('[WorkDashboard] addLeave success:', data); }
    await fetchAll();
  };

  const deleteProject = async (id: string) => {
    await (supabase.from('projects' as any).delete().eq('id', id) as any);
    fetchAll();
  };

  const deleteEvent = async (id: string) => {
    await (supabase.from('team_events' as any).delete().eq('id', id) as any);
    fetchAll();
  };

  const deleteLeave = async (id: string) => {
    await (supabase.from('leaves' as any).delete().eq('id', id) as any);
    fetchAll();
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

  return {
    projects, events, leaves, balances, projectTypes, loading,
    addProject, addEvent, addLeave,
    deleteProject, deleteEvent, deleteLeave,
    addProjectType, deleteProjectType,
    refetch: fetchAll,
  };
}
