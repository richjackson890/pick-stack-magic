import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  invited_email: string;
  status: string;
  created_at: string;
  profiles?: {
    name: string | null;
    display_name: string | null;
    position: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  token: string;
  status: string;
  created_at: string;
}

export function useTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      // Step 1: Find user's team via team_members
      let currentTeam: Team | null = null;

      const { data: memberRow } = await (supabase
        .from('team_members' as any)
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle() as any);

      if (memberRow?.team_id) {
        const { data: teamData } = await (supabase
          .from('teams' as any)
          .select('*')
          .eq('id', memberRow.team_id)
          .maybeSingle() as any);
        currentTeam = teamData;
      }

      if (!currentTeam) {
        setTeam(null);
        setMembers([]);
        setInvites([]);
        setLoading(false);
        return;
      }

      setTeam(currentTeam);

      // Step 2: Fetch team_members by team_id
      const { data: membersData } = await (supabase
        .from('team_members' as any)
        .select('*')
        .eq('team_id', currentTeam.id)
        .eq('status', 'accepted')
        .order('created_at') as any);

      const rawMembers: TeamMember[] = membersData || [];

      // Step 3: Fetch profiles for display
      if (rawMembers.length > 0) {
        const userIds = [...new Set(rawMembers.map(m => m.user_id))];
        const { data: profiles } = await (supabase
          .from('profiles' as any)
          .select('id, name, display_name, position, avatar_url, email')
          .in('id', userIds) as any);

        if (profiles) {
          const profileMap: Record<string, TeamMember['profiles']> = {};
          profiles.forEach((p: any) => {
            profileMap[p.id] = { name: p.name, display_name: p.display_name, position: p.position, avatar_url: p.avatar_url, email: p.email };
          });
          rawMembers.forEach(m => { m.profiles = profileMap[m.user_id]; });
        }
      }

      setMembers(rawMembers);

      // Step 4: Fetch pending invites
      const { data: invitesData } = await (supabase
        .from('team_invites' as any)
        .select('*')
        .eq('team_id', currentTeam.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }) as any);

      setInvites(invitesData || []);
    } catch {
      // Silently handle — 406/empty results are not real errors
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const createTeam = async (name: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: newTeam, error } = await (supabase
        .from('teams' as any)
        .insert({ name, created_by: user.id })
        .select()
        .single() as any);

      if (error) throw error;

      // Add self as member
      await (supabase.from('team_members' as any).insert({
        team_id: newTeam.id,
        user_id: user.id,
        invited_email: user.email,
        status: 'accepted',
      }) as any);

      await fetchTeam();
      toast({ title: 'Team created!' });
      return true;
    } catch (err: any) {
      console.error('[useTeam] createTeam error:', err);
      toast({ title: 'Failed to create team', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const inviteMember = async (email: string): Promise<string | null> => {
    if (!user || !team) return null;
    try {
      const { data, error } = await (supabase
        .from('team_invites' as any)
        .insert({ team_id: team.id, email })
        .select()
        .single() as any);

      if (error) throw error;

      // Pre-create membership row (user_id=null until accepted)
      await (supabase.from('team_members' as any).insert({
        team_id: team.id,
        user_id: null,
        invited_email: email,
        status: 'pending',
      }) as any);

      await fetchTeam();
      toast({ title: `Invite sent to ${email}` });
      return data.token;
    } catch (err: any) {
      console.error('[useTeam] invite error:', err);
      toast({ title: 'Failed to send invite', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const acceptInvite = async (token: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.rpc('accept_team_invite', { invite_token: token });

      if (error) throw error;

      await fetchTeam();
      toast({ title: 'Team joined!' });
      return true;
    } catch (err: any) {
      console.error('[useTeam] acceptInvite error:', err);
      toast({ title: 'Failed to join team', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    team,
    members,
    invites,
    loading,
    createTeam,
    inviteMember,
    acceptInvite,
    refetch: fetchTeam,
  };
}
