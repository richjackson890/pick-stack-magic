import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkDashboard, Project, TeamEvent, Leave, WeekSnapshot } from '@/hooks/useWorkDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember } from '@/hooks/useTeam';
import { GuideTooltip } from '@/components/GuideTooltip';
import { ChevronDown, Plus, Briefcase, Calendar, PalmtreeIcon as Palmtree, Trash2, Loader2, X, Check, Pencil, Users, Printer, History, GripVertical, Undo2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkDashboardProps {
  teamId: string | undefined;
  teamMembers: TeamMember[];
}

type FormType = 'project' | 'event' | 'leave' | null;

const getTodayKST = () => {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
};

const getDisplayName = (profiles?: { display_name?: string | null; name?: string | null; email?: string }) =>
  profiles?.display_name || profiles?.name || profiles?.email?.split('@')[0] || '?';

interface TaskDraft {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
}

export function WorkDashboard({ teamId, teamMembers }: WorkDashboardProps) {
  const { user } = useAuth();
  const {
    projects, events, leaves, balances, projectTypes, loading,
    addProject, addEvent, addLeave,
    updateProject, updateEvent, updateLeave,
    deleteProject, deleteEvent, deleteLeave, deleteProjectTask,
    addProjectType, deleteProjectType,
    upsertLeaveBalance,
    deletedProjects, deletedEvents, deletedLeaves,
    restoreProject, restoreEvent, restoreLeave,
    updateProjectOrder,
    snapshots, viewingSnapshot, viewSnapshot,
  } = useWorkDashboard(teamId);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  const isReadOnly = !!viewingSnapshot;
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [saving, setSaving] = useState(false);

  // Leave balance edit
  const [editBalanceUserId, setEditBalanceUserId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState('');
  const [editUsed, setEditUsed] = useState('');

  // Edit target IDs (null = create mode)
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);

  // Project form
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  // Leave form
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState<'연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차' | '외출'>('연차');
  const [leaveUserId, setLeaveUserId] = useState('');
  const [leaveStartTime, setLeaveStartTime] = useState('');
  const [leaveEndTime, setLeaveEndTime] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Custom type
  const [newTypeName, setNewTypeName] = useState('');

  // Native HTML5 drag-and-drop state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'event' | 'leave'; id: string } | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'project') await deleteProject(deleteConfirm.id);
    else if (deleteConfirm.type === 'event') await deleteEvent(deleteConfirm.id);
    else if (deleteConfirm.type === 'leave') await deleteLeave(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const toggle = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const getCreatorName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member ? getDisplayName(member.profiles) : '?';
  };

  const resetForm = () => {
    setEditProjectId(null); setEditEventId(null); setEditLeaveId(null);
  };

  const openForm = (type: FormType) => {
    const today = getTodayKST();
    resetForm();
    setProjectName(''); setProjectType(''); setSelectedMembers(new Set()); setTaskDrafts([]);
    setEventTitle(''); setEventDate(today); setEventTime('');
    setLeaveDate(today); setLeaveType('연차'); setLeaveUserId(user?.id || '');
    setLeaveStartTime(''); setLeaveEndTime(''); setLeaveReason('');
    setActiveForm(type);
  };

  // Edit openers
  const openEditProject = (p: Project) => {
    resetForm();
    setEditProjectId(p.id);
    setProjectName(p.name);
    setProjectType(p.type || '');
    setSelectedMembers(new Set(p.members.map(m => m.user_id)));
    setTaskDrafts(p.tasks.map(t => ({ id: t.id, title: t.title, start_date: t.start_date, end_date: t.end_date })));
    setActiveForm('project');
  };

  const openEditEvent = (e: TeamEvent) => {
    resetForm();
    setEditEventId(e.id);
    setEventTitle(e.title);
    setEventDate(e.event_date);
    setEventTime(e.event_time || '');
    setActiveForm('event');
  };

  const openEditLeave = (l: Leave) => {
    resetForm();
    setEditLeaveId(l.id);
    setLeaveDate(l.leave_date);
    setLeaveType(l.type);
    setLeaveStartTime(l.start_time || '');
    setLeaveEndTime(l.end_time || '');
    setLeaveReason(l.reason || '');
    setActiveForm('leave');
  };

  const toggleMember = (uid: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  // Task draft helpers
  const addTaskDraft = () => {
    const today = getTodayKST();
    setTaskDrafts(prev => [...prev, { title: '', start_date: today, end_date: today }]);
  };

  const updateTaskDraft = (idx: number, field: keyof TaskDraft, value: string) => {
    setTaskDrafts(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const removeTaskDraft = (idx: number) => {
    setTaskDrafts(prev => prev.filter((_, i) => i !== idx));
  };

  // Task draft drag reorder
  const [dragTaskIdx, setDragTaskIdx] = useState<number | null>(null);
  const [dragOverTaskIdx, setDragOverTaskIdx] = useState<number | null>(null);

  const handleTaskDrop = (dropIdx: number) => {
    if (dragTaskIdx === null || dragTaskIdx === dropIdx) return;
    setTaskDrafts(prev => {
      const reordered = [...prev];
      const [moved] = reordered.splice(dragTaskIdx, 1);
      reordered.splice(dropIdx, 0, moved);
      return reordered;
    });
    setDragTaskIdx(null);
    setDragOverTaskIdx(null);
  };

  const handleSubmitProject = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    const validTasks = taskDrafts.filter(t => t.title.trim() && t.start_date && t.end_date);
    if (editProjectId) {
      await updateProject(editProjectId, projectName, projectType, [...selectedMembers], validTasks);
    } else {
      await addProject(projectName, projectType, [...selectedMembers], validTasks.length > 0 ? validTasks : undefined);
    }
    setSaving(false);
    setActiveForm(null);
  };

  const handleSubmitEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;
    setSaving(true);
    if (editEventId) {
      await updateEvent(editEventId, eventTitle, eventDate, eventTime);
    } else {
      await addEvent(eventTitle, eventDate, eventTime);
    }
    setSaving(false);
    setActiveForm(null);
  };

  const handleSubmitLeave = async () => {
    if (!leaveDate) return;
    setSaving(true);
    const extra = leaveType === '외출' ? { start_time: leaveStartTime, end_time: leaveEndTime, reason: leaveReason } : undefined;
    if (editLeaveId) {
      await updateLeave(editLeaveId, leaveDate, leaveType, extra);
    } else {
      await addLeave(leaveDate, leaveType, leaveUserId || undefined, extra);
    }
    setSaving(false);
    setActiveForm(null);
  };

  const leaveLabel = (type: string) => type;

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  const formatShortDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAdmin = true; // All team members can manage

  // 주간 날짜 라벨
  const fmtWeekDate = (d: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
  };
  const getWeekLabel = () => {
    if (viewingSnapshot) {
      const mon = new Date(viewingSnapshot.week_start + 'T00:00:00');
      const fri = new Date(viewingSnapshot.week_end + 'T00:00:00');
      return `${fmtWeekDate(mon)} ~ ${fmtWeekDate(fri)}`;
    }
    const now = new Date();
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  };
  const getSnapshotLabel = (s: WeekSnapshot) => {
    const mon = new Date(s.week_start + 'T00:00:00');
    const fri = new Date(s.week_end + 'T00:00:00');
    return `${fmtWeekDate(mon)} ~ ${fmtWeekDate(fri)}`;
  };

  const handlePrint = () => {
    const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const projectsHtml = projects.map(p => {
      const memberNames = p.members.map(m => [m.position, m.name].filter(Boolean).join(' ')).join(', ');
      const tasksHtml = (p.tasks || []).map(t =>
        `<tr class="sub"><td class="sub-name">└ ${esc(t.title)}</td><td></td><td></td><td class="r mono">${formatShortDate(t.start_date)} ~ ${formatShortDate(t.end_date)}</td></tr>`
      ).join('');
      return `<tr class="proj-row">
        <td class="bold">${esc(p.name)}</td>
        <td class="type-col">${p.type ? `(${esc(p.type)})` : ''}</td>
        <td class="accent">${esc(memberNames)}</td>
        <td class="r">${p.tasks.length > 0 ? p.tasks.length + '건' : ''}</td>
      </tr>${tasksHtml}`;
    }).join('') || '<tr><td colspan="4" class="empty">등록된 프로젝트가 없습니다</td></tr>';

    const eventsHtml = events.map(e =>
      `<tr>
        <td class="mono" style="width:90px">${formatDate(e.event_date)}</td>
        <td class="accent" style="width:50px">${e.event_time ? esc(e.event_time) : ''}</td>
        <td>${esc(e.title)}</td>
      </tr>`
    ).join('') || '<tr><td colspan="3" class="empty">일정 없음</td></tr>';

    const leavesHtml = leaves.map(l => {
      const lname = l.profile?.display_name || l.profile?.name || '';
      return `<tr>
        <td class="mono" style="width:90px">${formatDate(l.leave_date)}</td>
        <td style="width:70px"><span class="tag ${l.type === '연차' ? 'tag-red' : l.type === '외출' ? 'tag-blue' : l.type.includes('반반') ? 'tag-purple' : 'tag-amber'}">${esc(l.type)}</span></td>
        <td>${esc(lname)}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="3" class="empty">연차 없음</td></tr>';

    const balanceRows = teamMembers.map(m => {
      const bal = balances.find(b => b.user_id === m.user_id);
      const name = getDisplayName(m.profiles);
      const pos = m.profiles?.position || '';
      const label = (pos ? esc(pos) + ' ' : '') + esc(name);
      if (!bal) return `<tr><td>${label}</td><td class="c">-</td><td class="c">-</td><td class="c muted">미등록</td></tr>`;
      const remaining = bal.total_days - bal.used_days;
      const color = remaining <= 2 ? '#ef4444' : remaining <= 5 ? '#f59e0b' : '#f97316';
      return `<tr>
        <td>${label}</td>
        <td class="c mono">${bal.total_days}</td>
        <td class="c mono">${bal.used_days}</td>
        <td class="c bold" style="color:${color}">${remaining}</td>
      </tr>`;
    }).join('');

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>DLab1 주간업무</title>
<style>
  @page { size:A4; margin:14mm 16mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font:11px/1.55 'Malgun Gothic','맑은 고딕',sans-serif; color:#222; }

  /* Header */
  .hd { display:flex; align-items:baseline; justify-content:space-between; padding-bottom:6px; margin-bottom:14px; border-bottom:2px solid #f97316; }
  .hd h1 { font-size:14px; font-weight:800; color:#111; letter-spacing:-0.3px; }
  .hd span { font-size:10px; color:#888; }

  /* Section */
  .sec { margin-bottom:12px; break-inside:avoid; }
  .sec-t { font-size:11px; font-weight:700; color:#333; padding:3px 0; margin-bottom:4px; border-bottom:1.5px solid #333; }
  .sec-t::before { content:''; display:inline-block; width:3px; height:10px; background:#f97316; margin-right:6px; vertical-align:-1px; }

  /* Tables */
  table { width:100%; border-collapse:collapse; font-size:10px; }
  td { padding:3px 4px; border-bottom:1px solid #eee; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .bold { font-weight:700; }
  .r { text-align:right; }
  .c { text-align:center; }
  .mono { font-family:'Consolas','Courier New',monospace; font-size:9.5px; }
  .accent { color:#f97316; }
  .muted { color:#aaa; }
  .empty { text-align:center; color:#bbb; padding:8px; }

  /* Project table columns */
  .proj-table td:nth-child(1) { width:30%; }
  .proj-table td:nth-child(2) { width:15%; text-align:left; }
  .proj-table td:nth-child(3) { width:25%; }
  .proj-table td:nth-child(4) { width:30%; text-align:right; white-space:nowrap; }
  .proj-table thead td { font-weight:700; color:#666; font-size:9px; border-bottom:1.5px solid #ddd; background:#fafafa; }
  .proj-row td { border-bottom:1px solid #ddd; }
  .type-col { color:#555; font-size:9.5px; text-align:left; }
  tr.sub td { color:#666; font-size:9.5px; padding-top:1.5px; padding-bottom:1.5px; border-bottom:1px solid #f5f5f5; }
  .sub-name { padding-left:1.2em; }

  /* Tags (leaves) */
  .tag { display:inline-block; padding:0 5px; border-radius:3px; font-size:9px; font-weight:600; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
  .tag-red { background:#fff1f2; color:#be123c; border-color:#fecdd3; }
  .tag-amber { background:#fffbeb; color:#b45309; border-color:#fde68a; }
  .tag-purple { background:#f5f3ff; color:#6d28d9; border-color:#ddd6fe; }
  .tag-blue { background:#eff6ff; color:#2563eb; border-color:#bfdbfe; }

  /* Balance table */
  .bal-table td { padding:2.5px 6px; }
  .bal-table thead td { font-weight:700; color:#666; font-size:9px; border-bottom:1.5px solid #ddd; background:#fafafa; }

  /* Footer */
  .ft { margin-top:14px; padding-top:4px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8px; color:#bbb; }
</style>
</head>
<body>
  <div class="hd">
    <h1>DLab1 주간업무</h1>
    <span>${getWeekLabel()}</span>
  </div>

  <div class="sec">
    <div class="sec-t">프로젝트 현황</div>
    <table class="proj-table">
      <thead><tr><td>프로젝트명</td><td>타입</td><td>담당자</td><td class="r">건수/기간</td></tr></thead>
      <tbody>${projectsHtml}</tbody>
    </table>
  </div>

  <div class="sec">
    <div class="sec-t">이번 달 일정</div>
    <table>${eventsHtml}</table>
  </div>

  <div class="sec">
    <div class="sec-t">연차/휴가</div>
    <table>${leavesHtml}</table>
  </div>

  <div class="sec">
    <div class="sec-t">팀원 연차 현황</div>
    <table class="bal-table">
      <thead><tr><td>이름</td><td class="c">총 연차</td><td class="c">사용</td><td class="c">잔여</td></tr></thead>
      <tbody>${balanceRows}</tbody>
    </table>
  </div>

  <div class="ft">
    <span>출력일 ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span>DLab Architecture</span>
  </div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (!teamId) {
    return (
      <div id="work-dashboard" className="space-y-4 min-w-0 w-full">
        <div className="flex items-center gap-2 pb-3 border-b border-border min-w-0">
          <h2 className="text-lg font-bold text-foreground flex-1 min-w-0 truncate">주간업무</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
            팀에 초대받은 링크가 있으신가요?<br />
            링크로 접속하거나 팀장에게 초대를 요청하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="work-dashboard" className="space-y-4 min-w-0 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border print-header min-w-0">
        <h2 className="text-lg font-bold text-foreground flex-1 min-w-0 truncate">
          DLab1 주간업무
          {isReadOnly && <span className="text-sm font-normal text-muted-foreground ml-2">(히스토리)</span>}
        </h2>
        <span className="text-xs text-muted-foreground font-mono shrink-0">{getWeekLabel()}</span>

        {/* History dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn("shrink-0 transition-colors", isReadOnly ? "text-primary" : "text-muted-foreground hover:text-primary")}
            title="주간 히스토리"
          >
            <History className="h-5 w-5" />
          </button>
          {showHistory && (
            <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border bg-popover shadow-lg py-1">
              <button
                onClick={() => { viewSnapshot(null); setShowHistory(false); }}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-secondary/50", !viewingSnapshot && "font-bold text-primary")}
              >
                이번 달
              </button>
              {snapshots.length > 0 && <div className="border-t my-1" />}
              {snapshots.map(s => (
                <button
                  key={s.id}
                  onClick={() => { viewSnapshot(s); setShowHistory(false); }}
                  className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-secondary/50", viewingSnapshot?.id === s.id && "font-bold text-primary")}
                >
                  {getSnapshotLabel(s)}
                </button>
              ))}
              {snapshots.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">저장된 히스토리 없음</p>}
            </div>
          )}
        </div>

        <button onClick={handlePrint} className="text-muted-foreground hover:text-primary shrink-0 print-hide" title="인쇄">
          <Printer className="h-5 w-5" />
        </button>
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-sm text-amber-600 flex-1">과거 주간 데이터를 보고 있습니다 (읽기 전용)</span>
          <button onClick={() => viewSnapshot(null)} className="text-sm text-primary font-medium hover:underline">현재로 돌아가기</button>
        </div>
      )}

      {/* 1. 프로젝트 현황 */}
      <Section icon={<Briefcase className="h-5 w-5" />} title="프로젝트 현황" count={projects.length} collapsed={!!collapsed.projects} onToggle={() => toggle('projects')}>
        {projects.length === 0 ? (
          <p className="text-base text-muted-foreground py-4 text-center">등록된 프로젝트가 없습니다</p>
        ) : (
          <div className="divide-y divide-border/30">
            {projects.map(p => (
              <ProjectRow
                key={p.id}
                project={p}
                isReadOnly={isReadOnly}
                isDragging={dragId === p.id}
                isDragOver={dragOverId === p.id}
                getCreatorName={getCreatorName}
                formatShortDate={formatShortDate}
                onEdit={() => openEditProject(p)}
                onDelete={() => setDeleteConfirm({ type: 'project', id: p.id })}
                onDeleteTask={(taskId) => deleteProjectTask(taskId)}
                onDragStart={() => setDragId(p.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                onDragOver={() => setDragOverId(p.id)}
                onDrop={() => {
                  if (!dragId || dragId === p.id) return;
                  const oldIdx = projects.findIndex(pr => pr.id === dragId);
                  const newIdx = projects.findIndex(pr => pr.id === p.id);
                  if (oldIdx === -1 || newIdx === -1) return;
                  const reordered = [...projects];
                  const [moved] = reordered.splice(oldIdx, 1);
                  reordered.splice(newIdx, 0, moved);
                  updateProjectOrder(reordered.map(pr => pr.id));
                  setDragId(null);
                  setDragOverId(null);
                }}
              />
            ))}
          </div>
        )}
        {!isReadOnly && (
          <GuideTooltip name="add_project" message="진행 중인 프로젝트를 등록하세요. 마감일과 담당자를 설정할 수 있어요" position="top">
            <AddButton label="Add Project" onClick={() => openForm('project')} />
          </GuideTooltip>
        )}
      </Section>

      {/* 2. 이번 달 일정 */}
      <Section icon={<Calendar className="h-5 w-5" />} title="이번 달 일정" count={events.length} collapsed={!!collapsed.events} onToggle={() => toggle('events')}>
          {events.length === 0 ? (
            <p className="text-base text-muted-foreground py-4 text-center">No events</p>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{formatDate(e.event_date)}</span>
                  {e.event_time && <span className="text-xs text-primary font-medium shrink-0 whitespace-nowrap">{e.event_time}</span>}
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{getCreatorName(e.created_by)}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isReadOnly && <button onClick={() => openEditEvent(e)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>}
                    {!isReadOnly && <button onClick={() => setDeleteConfirm({ type: 'event', id: e.id })} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isReadOnly && (
            <GuideTooltip name="add_event" message="팀 회의, 발표, 납품 등 중요한 일정을 등록하세요" position="top">
              <AddButton label="Add Event" onClick={() => openForm('event')} />
            </GuideTooltip>
          )}
        </Section>

      {/* 3. Leaves */}
      <Section icon={<Palmtree className="h-5 w-5" />} title="Leaves" count={leaves.length} collapsed={!!collapsed.leaves} onToggle={() => toggle('leaves')}>
          {leaves.length === 0 ? (
            <p className="text-base text-muted-foreground py-4 text-center">No leaves</p>
          ) : (
            <div className="space-y-2">
              {leaves.map(l => (
                <div key={l.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{formatDate(l.leave_date)}</span>
                  <span className={cn(
                    "text-sm px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap",
                    l.type === '연차' ? 'bg-rose-500/15 text-rose-400' :
                    l.type === '외출' ? 'bg-blue-500/15 text-blue-400' :
                    (l.type === '오전반차' || l.type === '오후반차') ? 'bg-amber-500/15 text-amber-400' :
                    'bg-violet-500/15 text-violet-400'
                  )}>{leaveLabel(l.type)}</span>
                  <span className="text-sm font-medium min-w-0 truncate">{l.profile?.display_name || l.profile?.name || 'Unknown'}</span>
                  {l.type === '외출' && (l.start_time || l.reason) && (
                    <span className="text-xs text-muted-foreground truncate">
                      {l.start_time && l.end_time ? `${l.start_time.slice(0,5)}~${l.end_time.slice(0,5)}` : l.start_time ? l.start_time.slice(0,5) : ''}
                      {l.reason ? ` ${l.reason}` : ''}
                    </span>
                  )}
                  <span className="flex-1" />
                  <div className="flex items-center gap-1 shrink-0">
                    {!isReadOnly && <button onClick={() => openEditLeave(l)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>}
                    {!isReadOnly && <button onClick={() => setDeleteConfirm({ type: 'leave', id: l.id })} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isReadOnly && (
            <GuideTooltip name="add_leave" message="연차, 반차 등 휴가를 신청하세요. 팀원 모두가 확인할 수 있어요" position="top">
              <AddButton label="Add Leave" onClick={() => openForm('leave')} />
            </GuideTooltip>
          )}
      </Section>

      {/* 4. 팀원 연차 현황 */}
      <Section
        icon={
          <GuideTooltip name="leave_status" message="팀원별 연차 사용 현황을 한눈에 볼 수 있어요. 연필 아이콘으로 연간 연차 일수를 수정할 수 있어요" position="bottom">
            <Users className="h-5 w-5" />
          </GuideTooltip>
        }
        title="팀원 연차 현황" count={teamMembers.length} collapsed={!!collapsed.teamLeave} onToggle={() => toggle('teamLeave')}>
        {teamMembers.length === 0 ? (
          <p className="text-base text-muted-foreground py-4 text-center">팀원이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map(m => {
              const bal = balances.find(b => b.user_id === m.user_id);
              const isMe = user?.id === m.user_id;
              const canEdit = isMe || isAdmin;
              const isEditing = editBalanceUserId === m.user_id;
              const name = getDisplayName(m.profiles);
              const pos = m.profiles?.position;

              if (isEditing) {
                return (
                  <div key={m.user_id} className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium flex-1 truncate">{pos && <span className="text-muted-foreground text-sm">{pos}</span>} {name}</span>
                      <button onClick={() => setEditBalanceUserId(null)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-muted-foreground block mb-1">총 연차</label>
                        <Input type="number" value={editTotal} onChange={e => setEditTotal(e.target.value)} className="h-9 text-base" step="0.25" min="0" />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-muted-foreground block mb-1">사용</label>
                        <Input type="number" value={editUsed} onChange={e => setEditUsed(e.target.value)} className="h-9 text-base" step="0.25" min="0" />
                      </div>
                      <Button className="h-9 px-5 mt-6" disabled={saving} onClick={async () => {
                        setSaving(true);
                        await upsertLeaveBalance(parseFloat(editTotal) || 0, parseFloat(editUsed) || 0, m.user_id);
                        setSaving(false);
                        setEditBalanceUserId(null);
                      }}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
                      </Button>
                    </div>
                  </div>
                );
              }

              if (!bal) {
                return (
                  <div key={m.user_id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-secondary/20">
                    <span className="text-base font-medium flex-1 truncate">{pos && <span className="text-muted-foreground text-sm">{pos}</span>} {name}</span>
                    <span className="text-sm text-muted-foreground">미등록</span>
                    {canEdit && (
                      <button onClick={() => { setEditBalanceUserId(m.user_id); setEditTotal('15'); setEditUsed('0'); }} className="text-sm text-primary font-medium hover:underline shrink-0">등록</button>
                    )}
                  </div>
                );
              }

              const remaining = bal.total_days - bal.used_days;
              const pct = bal.total_days > 0 ? (remaining / bal.total_days) * 100 : 0;
              const colorClass = remaining <= 2 ? 'text-red-400' : remaining <= 5 ? 'text-amber-400' : 'text-emerald-400';
              const barColor = remaining <= 2 ? 'hsl(0, 72%, 51%)' : remaining <= 5 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 71%, 45%)';

              return (
                <div key={m.user_id} className="py-2.5 px-3 rounded-xl bg-secondary/20 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium flex-1 truncate">{pos && <span className="text-muted-foreground text-sm">{pos}</span>} {name}</span>
                    <span className="text-sm text-muted-foreground font-mono">{bal.used_days}/{bal.total_days}</span>
                    <span className={cn("text-base font-bold font-mono w-9 text-right", colorClass)}>{remaining}</span>
                    {canEdit && (
                      <button onClick={() => { setEditBalanceUserId(m.user_id); setEditTotal(String(bal.total_days)); setEditUsed(String(bal.used_days)); }} className="text-muted-foreground hover:text-primary shrink-0"><Pencil className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ====== Modal forms (create & edit) ====== */}
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
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {activeForm === 'project' && (editProjectId ? 'Edit Project' : 'New Project')}
                  {activeForm === 'event' && (editEventId ? 'Edit Event' : 'New Event')}
                  {activeForm === 'leave' && (editLeaveId ? 'Edit Leave' : 'Request Leave')}
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

                  {/* Task drafts */}
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
                      업무 항목 ({taskDrafts.length})
                    </label>
                    {taskDrafts.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {taskDrafts.map((td, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => setDragTaskIdx(idx)}
                            onDragEnd={() => { setDragTaskIdx(null); setDragOverTaskIdx(null); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverTaskIdx(idx); }}
                            onDrop={(e) => { e.preventDefault(); handleTaskDrop(idx); }}
                            className={cn(
                              "p-2.5 rounded-lg border border-border/30 space-y-1.5 transition-opacity",
                              dragTaskIdx === idx && "opacity-50",
                              dragOverTaskIdx === idx && dragTaskIdx !== idx && "border-primary",
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                              <Input
                                placeholder="업무 제목"
                                value={td.title}
                                onChange={e => updateTaskDraft(idx, 'title', e.target.value)}
                                className="flex-1 h-7 text-xs"
                              />
                              <button onClick={() => removeTaskDraft(idx)} className="text-muted-foreground hover:text-destructive shrink-0">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="date"
                                value={td.start_date}
                                onChange={e => updateTaskDraft(idx, 'start_date', e.target.value)}
                                className="flex-1 h-7 text-xs"
                              />
                              <span className="text-[10px] text-muted-foreground">~</span>
                              <Input
                                type="date"
                                value={td.end_date}
                                onChange={e => updateTaskDraft(idx, 'end_date', e.target.value)}
                                className="flex-1 h-7 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={addTaskDraft}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border/50 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      업무 추가
                    </button>
                  </div>

                  {teamMembers.length > 0 && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">
                        Members ({selectedMembers.size} selected)
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border/30 p-2">
                        {teamMembers.map(m => {
                          const name = getDisplayName(m.profiles);
                          const mPos = m.profiles?.position;
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
                              <span className="text-sm flex-1">{mPos && <span className="text-muted-foreground">{mPos} </span>}{name}</span>
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
                  <Button className="w-full" onClick={handleSubmitProject} disabled={!projectName.trim() || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editProjectId ? 'Save Changes' : 'Add Project'}
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
                  <Button className="w-full" onClick={handleSubmitEvent} disabled={!eventTitle.trim() || !eventDate || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editEventId ? 'Save Changes' : 'Add Event'}
                  </Button>
                </div>
              )}

              {/* ---- Leave Form ---- */}
              {activeForm === 'leave' && (
                <div className="space-y-3">
                  {!editLeaveId && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-medium mb-1 block">대상 팀원</label>
                      <select
                        value={leaveUserId}
                        onChange={e => setLeaveUserId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {isAdmin ? (
                          teamMembers.map(m => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.profiles?.position ? `${m.profiles.position} ` : ''}{getDisplayName(m.profiles)}
                            </option>
                          ))
                        ) : (
                          <option value={user?.id || ''}>{getDisplayName(teamMembers.find(m => m.user_id === user?.id)?.profiles)}</option>
                        )}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Date *</label>
                    <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium mb-1.5 block">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {([['연차', '연차'], ['오전반차', '오전반차'], ['오후반차', '오후반차'], ['오전반반차', '오전반반차'], ['오후반반차', '오후반반차'], ['외출', '외출']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setLeaveType(val)}
                          className={cn(
                            'flex-1 min-w-[calc(33%-8px)] py-2 rounded-lg text-xs font-medium transition-colors border',
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
                  {leaveType === '외출' && (
                    <>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] text-muted-foreground font-medium mb-1 block">출발 시간</label>
                          <Input type="time" value={leaveStartTime} onChange={e => setLeaveStartTime(e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] text-muted-foreground font-medium mb-1 block">복귀 시간</label>
                          <Input type="time" value={leaveEndTime} onChange={e => setLeaveEndTime(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground font-medium mb-1 block">외출 사유</label>
                        <Input placeholder="예: 현장 답사" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} />
                      </div>
                    </>
                  )}
                  <Button className="w-full" onClick={handleSubmitLeave} disabled={!leaveDate || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editLeaveId ? 'Save Changes' : 'Request Leave'}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 최근 삭제된 항목 */}
      {!isReadOnly && (deletedProjects.length + deletedEvents.length + deletedLeaves.length > 0) && (
        <Section icon={<Trash2 className="h-5 w-5" />} title="최근 삭제된 항목" count={deletedProjects.length + deletedEvents.length + deletedLeaves.length} collapsed={!collapsed.deleted} onToggle={() => toggle('deleted')}>
          <div className="space-y-2">
            {deletedProjects.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 opacity-60 min-w-0">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 min-w-0 truncate">{p.name}</span>
                <button onClick={() => restoreProject(p.id)} className="text-primary hover:text-primary/80 shrink-0" title="복구">
                  <Undo2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {deletedEvents.map(e => (
              <div key={e.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 opacity-60 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-mono shrink-0">{e.event_date}</span>
                <span className="text-sm flex-1 min-w-0 truncate">{e.title}</span>
                <button onClick={() => restoreEvent(e.id)} className="text-primary hover:text-primary/80 shrink-0" title="복구">
                  <Undo2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {deletedLeaves.map(l => (
              <div key={l.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/20 opacity-60 min-w-0">
                <Palmtree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-mono shrink-0">{l.leave_date}</span>
                <span className="text-sm flex-1 min-w-0 truncate">{l.type}</span>
                <button onClick={() => restoreLeave(l.id)} className="text-primary hover:text-primary/80 shrink-0" title="복구">
                  <Undo2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        message="정말 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Print-only footer */}
      <div className="hidden print-footer">
        <div className="flex items-center justify-between pt-4 mt-6 border-t border-border">
          <span className="text-xs text-gray-400">출력일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="text-xs text-gray-400">DLab Architecture</span>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ProjectRow({
  project: p,
  isReadOnly,
  isDragging,
  isDragOver,
  getCreatorName,
  formatShortDate,
  onEdit,
  onDelete,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  project: Project;
  isReadOnly: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  getCreatorName: (uid: string) => string;
  formatShortDate: (d: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteTask: (taskId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable={!isReadOnly}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={cn(
        "py-4 first:pt-0 last:pb-0 space-y-2 group/row transition-opacity",
        isDragging && "opacity-50",
        isDragOver && !isDragging && "border-t-2 border-primary",
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        {!isReadOnly && (
          <span className="shrink-0 mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/0 group-hover/row:text-muted-foreground transition-colors">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="flex-1 min-w-0 overflow-hidden space-y-1">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="text-base font-semibold truncate min-w-0">{p.name}</span>
            {p.type && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0 whitespace-nowrap">{p.type}</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground overflow-hidden">
            <span className="shrink-0">{getCreatorName(p.created_by)}</span>
            {p.members.length > 0 && (
              <span className="text-primary font-medium break-all line-clamp-1">
                {p.members.map(m => [m.position, m.name].filter(Boolean).join(' ')).join(' · ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isReadOnly && <button onClick={onEdit} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>}
          {!isReadOnly && <button onClick={onDelete} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>
      {p.tasks.length > 0 && (
        <div className={cn("ml-4 space-y-1.5 border-l-2 border-primary/20 pl-4", !isReadOnly && "ml-9")}>
          {p.tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 group min-w-0">
              <span className="text-sm flex-1 min-w-0 truncate text-muted-foreground">{t.title}</span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{formatShortDate(t.start_date)} ~ {formatShortDate(t.end_date)}</span>
              {!isReadOnly && <button onClick={() => onDeleteTask(t.id)} className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3.5 w-3.5" /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  icon, title, count, collapsed, onToggle, children, maxHeight,
}: {
  icon: React.ReactNode; title: string; count: number;
  collapsed: boolean; onToggle: () => void; children: React.ReactNode;
  maxHeight?: string;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <span className="text-base font-semibold flex-1">{title}</span>
        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{count}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !collapsed && "rotate-180")} />
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
            <div className={cn("px-4 pb-4 space-y-2 overflow-y-auto min-w-0", maxHeight)}>
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
      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}
