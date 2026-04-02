import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Copy, Check, Crown, Link, Loader2 } from 'lucide-react';
import { LiquidSpinner } from '@/components/LiquidSpinner';

export function TeamTab() {
  const { user } = useAuth();
  const { team, members, invites, loading, createTeam, createInviteLink, acceptInvite } = useTeam();

  const [teamName, setTeamName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LiquidSpinner size="lg" />
      </div>
    );
  }

  // No team — show create/join
  if (!team) {
    return (
      <div className="container px-4 py-8 max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Team</h2>
          <p className="text-sm text-muted-foreground">Create a team or join with an invite code</p>
        </div>

        {/* Create team */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Create a Team
          </h3>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name (e.g. DLab Architecture)"
          />
          <Button
            className="w-full gradient-primary"
            disabled={!teamName.trim() || creating}
            onClick={async () => {
              setCreating(true);
              await createTeam(teamName.trim());
              setCreating(false);
            }}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Team
          </Button>
        </div>

        {/* Join with invite */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Join with Invite Code
          </h3>
          <Input
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            placeholder="Paste invite code"
          />
          <Button
            className="w-full"
            variant="outline"
            disabled={!inviteToken.trim() || joining}
            onClick={async () => {
              setJoining(true);
              await acceptInvite(inviteToken.trim());
              setJoining(false);
              setInviteToken('');
            }}
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Join Team
          </Button>
        </div>
      </div>
    );
  }

  // Has team — show team info
  const isOwner = team.created_by === user?.id;

  const handleCopyToken = (token: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const link = `${baseUrl}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="container px-4 py-6 max-w-md mx-auto space-y-6">
      {/* Team header */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{team.name}</h2>
            <p className="text-xs text-muted-foreground">{members.length} members</p>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold">Members</h3>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2.5">
              {m.profiles?.avatar_url ? (
                <img src={m.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                  {(m.profiles?.display_name || m.profiles?.name || '?')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.profiles?.position && <span className="text-muted-foreground text-xs mr-1">{m.profiles.position}</span>}
                  {m.profiles?.display_name || m.profiles?.name || m.profiles?.email}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.user_id === team.created_by ? 'Owner' : 'Member'}</p>
              </div>
              {m.user_id === team.created_by && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Invite (owner only) */}
      {isOwner && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Link className="h-4 w-4" />
            Invite Member
          </h3>
          <p className="text-xs text-muted-foreground">Generate a shareable invite link (valid for 7 days)</p>
          <Button
            className="w-full"
            disabled={generatingLink}
            onClick={async () => {
              setGeneratingLink(true);
              const link = await createInviteLink();
              if (link) {
                await navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
              }
              setGeneratingLink(false);
            }}
          >
            {generatingLink ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : copiedLink ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copiedLink ? 'Link Copied!' : 'Generate Invite Link'}
          </Button>

          {/* Active invite links */}
          {invites.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Active invite links ({invites.length})</p>
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground font-mono">...{inv.token.slice(-8)}</span>
                  <button
                    onClick={() => handleCopyToken(inv.token)}
                    className="flex items-center gap-1 text-primary hover:underline shrink-0 ml-2"
                  >
                    {copiedToken === inv.token ? (
                      <><Check className="h-3 w-3" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy link</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
