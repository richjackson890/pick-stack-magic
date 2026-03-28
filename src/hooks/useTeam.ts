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
  role: 'owner' | 'member';
  joined_at: string;
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
      // Find user's team membership — maybeSingle to avoid 406 when not in any team
      const { data: membership } = await (supabase
        .from('team_members_v2' as any)
        .select('team_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle() as any);

      if (!membership) {
        setTeam(null);
        setMembers([]);
        setInvites([]);
        setLoading(false);
        return;
      }

      // Fetch team — maybeSingle in case team was deleted
      const { data: teamData } = await (supabase
        .from('teams' as any)
        .select('*')
        .eq('id', membership.team_id)
        .maybeSingle() as any);

      if (teamData) setTeam(teamData);

      // Fetch members without join, then profiles separately
      const { data: membersData } = await (supabase
        .from('team_members_v2' as any)
        .select('*')
        .eq('team_id', membership.team_id)
        .order('joined_at') as any);

      const rawMembers: TeamMember[] = membersData || [];

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

      // Fetch invites
      const { data: invitesData } = await (supabase
        .from('team_invites' as any)
        .select('*')
        .eq('team_id', membership.team_id)
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

      // Add self as owner
      await (supabase.from('team_members_v2' as any).insert({
        team_id: newTeam.id,
        user_id: user.id,
        role: 'owner',
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
      // Find invite
      const { data: invite, error: findErr } = await (supabase
        .from('team_invites' as any)
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single() as any);

      if (findErr || !invite) throw new Error('Invalid or expired invite');

      // Add user to team
      await (supabase.from('team_members_v2' as any).insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: 'member',
      }) as any);

      // Mark invite accepted
      await (supabase.from('team_invites' as any)
        .update({ status: 'accepted' })
        .eq('id', invite.id) as any);

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
