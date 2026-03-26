import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkDashboard } from '@/hooks/useWorkDashboard';
import { TeamMember } from '@/hooks/useTeam';
import { ChevronDown, Plus, Briefcase, Calendar, PalmtreeIcon as Palmtree, BarChart3, Trash2, User, Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkDashboardProps {
  teamId: string | undefined;
  teamMembers: TeamMember[];
}

type FormType = 'project' | 'event' | 'leave' | null;

export function WorkDashboard({ teamId, teamMembers }: WorkDashboardProps) {
  const {
    projects, events, leaves, balances, projectTypes, loading,
    addProject, addEvent, addLeave,
    deleteProject, deleteEvent, deleteLeave,
    addProjectType, deleteProjectType,
  } = useWorkDashboard(teamId);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [saving, setSaving] = useState(false);

  // Project form
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  // Leave form
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState<'연차' | '반차' | '병가' | '기타'>('연차');

  // Custom type
  const [newTypeName, setNewTypeName] = useState('');

  const toggle = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const openForm = (type: FormType) => {
    setProjectName(''); setProjectType(''); setProjectDeadline(''); setSelectedMembers(new Set());
    setEventTitle(''); setEventDate(''); setEventTime('');
    setLeaveDate(''); setLeaveType('연차');
    setActiveForm(type);
  };

  const toggleMember = (uid: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleAddProject = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    await addProject(projectName, projectType, projectDeadline, [...selectedMembers]);
    setSaving(false);
    setActiveForm(null);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;
    setSaving(true);
    await addEvent(eventTitle, eventDate, eventTime);
    setSaving(false);
    setActiveForm(null);
  };

  const handleAddLeave = async () => {
    if (!leaveDate) return;
    setSaving(true);
    await addLeave(leaveDate, leaveType);
    setSaving(false);
    setActiveForm(null);
  };

  const leaveLabel = (type: string) => type;

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Projects */}
      <Section
        icon={<Briefcase className="h-4 w-4" />}
        title="Projects"
        count={projects.length}
        collapsed={!!collapsed.projects}
        onToggle={() => toggle('projects')}
      >
        {projects.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No active projects</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {p.type}
                      </span>
                    )}
                    {p.deadline && (
                      <span className="text-[10px] text-muted-foreground">
                        ~ {formatDate(p.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center -space-x-1.5 shrink-0">
                  {p.members.slice(0, 3).map(m => (
                    m.avatar_url ? (
                      <img key={m.user_id} src={m.avatar_url} className="w-6 h-6 rounded-full border-2 border-background object-cover" />
                    ) : (
                      <div key={m.user_id} className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                    )
                  ))}
                  {p.members.length > 3 && (
                    <span className="text-[9px] text-muted-foreground ml-1.5">+{p.members.length - 3}</span>
                  )}
                </div>
                <button onClick={() => deleteProject(p.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <AddButton label="Add Project" onClick={() => openForm('project')} />
      </Section>

      {/* 2. Schedule */}
      <Section
        icon={<Calendar className="h-4 w-4" />}
        title="This Week"
        count={events.length}
        collapsed={!!collapsed.events}
        onToggle={() => toggle('events')}
      >
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No events this week</p>
        ) : (
          <div className="space-y-1.5">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                <span className="text-[11px] text-muted-foreground font-mono shrink-0 w-16">
                  {formatDate(e.event_date)}
                </span>
                {e.event_time && (
                  <span className="text-[10px] text-primary font-medium shrink-0">{e.event_time}</span>
                )}
                <span className="text-sm flex-1 line-clamp-1">{e.title}</span>
                <button onClick={() => deleteEvent(e.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <AddButton label="Add Event" onClick={() => openForm('event')} />
      </Section>

      {/* 3. Leaves this week */}
      <Section
        icon={<Palmtree className="h-4 w-4" />}
        title="Leaves"
        count={leaves.length}
        collapsed={!!collapsed.leaves}
        onToggle={() => toggle('leaves')}
      >
        {leaves.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No leaves this week</p>
        ) : (
          <div className="space-y-1.5">
            {leaves.map(l => (
              <div key={l.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/20">
                {l.profile?.avatar_url ? (
                  <img src={l.profile.avatar_url} className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                )}
                <span className="text-sm flex-1">{l.profile?.name || 'Unknown'}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(l.leave_date)}</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                  l.type === '연차' ? 'bg-rose-500/15 text-rose-400' :
                  l.type === '병가' ? 'bg-cyan-500/15 text-cyan-400' :
                  'bg-amber-500/15 text-amber-400'
                )}>
                  {leaveLabel(l.type)}
                </span>
                <button onClick={() => deleteLeave(l.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <AddButton label="Add Leave" onClick={() => openForm('leave')} />
      </Section>

      {/* 4. Leave balance */}
      {balances.length > 0 && (
        <Section
          icon={<BarChart3 className="h-4 w-4" />}
          title="Leave Balance"
          count={balances.length}
          collapsed={!!collapsed.balance}
          onToggle={() => toggle('balance')}
        >
          <div className="space-y-2">
            {balances.map(b => {
              const remaining = b.total_days - b.used_days;
              const pct = b.total_days > 0 ? (remaining / b.total_days) * 100 : 0;
              return (
                <div key={b.user_id} className="flex items-center gap-2.5">
                  {b.profile?.avatar_url ? (
                    <img src={b.profile.avatar_url} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                  <span className="text-xs w-16 truncate shrink-0">{b.profile?.name || '?'}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct > 50 ? 'hsl(142, 71%, 45%)' : pct > 20 ? 'hsl(47, 96%, 53%)' : 'hsl(0, 72%, 51%)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 w-10 text-right">
                    {remaining}/{b.total_days}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ====== Modal forms ====== */}
      <AnimatePresence>
        {activeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={() => setActiveForm(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {activeForm === 'project' && 'New Project'}
                  {activeForm === 'event' && 'New Event'}
                  {activeForm === 'leave' && 'Request Leave'}
                </h3>
                <button onClick={() => setActiveForm(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ---- Project Form ---- */}
              {activeForm === 'project' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Project Name *</label>
                    <Input
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {projectTypes.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setProjectType(projectType === t.name ? '' : t.name)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border inline-flex items-center gap-1',
                            projectType === t.name
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border/50 text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {t.name}
                          {!t.is_default && (
                            <span
                              onClick={(e) => { e.stopPropagation(); deleteProjectType(t.id); if (projectType === t.name) setProjectType(''); }}
                              className="hover:text-destructive ml-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Input
                        placeholder="New type..."
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        className="flex-1 h-8 text-xs"
                        onKeyDown={e => { if (e.key === 'Enter' && newTypeName.trim()) { addProjectType(newTypeName); setNewTypeName(''); } }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={!newTypeName.trim()}
                        onClick={() => { addProjectType(newTypeName); setNewTypeName(''); }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Deadline</label>
                    <Input type="date" value={projectDeadline} onChange={e => setProjectDeadline(e.target.value)} />
                  </div>
                  {teamMembers.length > 0 && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
                        Members ({selectedMembers.size} selected)
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border/30 p-2">
                        {teamMembers.map(m => {
                          const name = m.profiles?.name || m.profiles?.email?.split('@')[0] || 'Unknown';
                          const checked = selectedMembers.has(m.user_id);
                          return (
                            <button
                              key={m.user_id}
                              onClick={() => toggleMember(m.user_id)}
                              className={cn(
                                'w-full flex items-center gap-2.5 p-1.5 rounded-lg transition-colors text-left',
                                checked ? 'bg-primary/10' : 'hover:bg-secondary/40'
                              )}
                            >
                              {m.profiles?.avatar_url ? (
                                <img src={m.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <User className="h-3 w-3" />
                                </div>
                              )}
                              <span className="text-xs flex-1">{name}</span>
                              <div className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                checked ? 'bg-primary border-primary' : 'border-border'
                              )}>
                                {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Button className="w-full" onClick={handleAddProject} disabled={!projectName.trim() || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Project'}
                  </Button>
                </div>
              )}

              {/* ---- Event Form ---- */}
              {activeForm === 'event' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Event Title *</label>
                    <Input
                      placeholder="Enter event title"
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Date *</label>
                    <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Time</label>
                    <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleAddEvent} disabled={!eventTitle.trim() || !eventDate || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Event'}
                  </Button>
                </div>
              )}

              {/* ---- Leave Form ---- */}
              {activeForm === 'leave' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Date *</label>
                    <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">Type</label>
                    <div className="flex gap-2">
                      {([['연차', '연차'], ['반차', '반차'], ['병가', '병가'], ['기타', '기타']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setLeaveType(val)}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-medium transition-colors border',
                            leaveType === val
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border/50 text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddLeave} disabled={!leaveDate || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Leave'}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function Section({
  icon, title, count, collapsed, onToggle, children,
}: {
  icon: React.ReactNode; title: string; count: number;
  collapsed: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-semibold flex-1">{title}</span>
        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">{count}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !collapsed && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}
