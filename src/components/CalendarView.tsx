import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, Calendar, Palmtree, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, TeamEvent, Leave } from '@/hooks/useWorkDashboard';
import { AnimatePresence, motion } from 'framer-motion';

interface CalendarViewProps {
  projects: Project[];
  events: TeamEvent[];
  leaves: Leave[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
  }

  // Next month padding (fill to 42 cells = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  return days;
}

function getLeaveColor(type: string) {
  if (type === '연차') return 'bg-rose-500';
  if (type === '오전반차' || type === '오후반차') return 'bg-amber-400';
  return 'bg-emerald-400';
}

function getLeaveLabel(type: string) {
  if (type === '연차') return '연차';
  if (type === '오전반차') return '오전반차';
  if (type === '오후반차') return '오후반차';
  if (type === '오전반반차') return '오전반반차';
  if (type === '오후반반차') return '오후반반차';
  return type;
}

export function CalendarView({ projects, events, leaves }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build lookup maps
  const tasksByDate = useMemo(() => {
    const map: Record<string, { project: string; task: string }[]> = {};
    projects.forEach(p => {
      p.tasks.forEach(t => {
        const start = new Date(t.start_date + 'T00:00:00');
        const end = new Date(t.end_date + 'T00:00:00');
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          if (!map[key]) map[key] = [];
          map[key].push({ project: p.name, task: t.title });
        }
      });
    });
    return map;
  }, [projects]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, TeamEvent[]> = {};
    events.forEach(e => {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    });
    return map;
  }, [events]);

  const leavesByDate = useMemo(() => {
    const map: Record<string, Leave[]> = {};
    leaves.forEach(l => {
      if (!map[l.leave_date]) map[l.leave_date] = [];
      map[l.leave_date].push(l);
    });
    return map;
  }, [leaves]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // Detail items for selected date
  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const selectedLeaves = selectedDate ? (leavesByDate[selectedDate] || []) : [];
  const hasSelectedItems = selectedTasks.length + selectedEvents.length + selectedLeaves.length > 0;

  return (
    <div className="container px-3 py-4 max-w-lg mx-auto pb-28 space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{year}년 {month + 1}월</h2>
          <button onClick={goToday} className="text-xs text-primary hover:underline">오늘</button>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> 태스크</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> 일정</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> 연차</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 반차</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 반반차</span>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/30">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={cn("text-center py-2 text-xs font-medium", i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground')}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((cell, idx) => {
            const hasTasks = !!tasksByDate[cell.date];
            const hasEvents = !!eventsByDate[cell.date];
            const hasLeaves = !!leavesByDate[cell.date];
            const isToday = cell.date === todayStr;
            const isSelected = cell.date === selectedDate;
            const dayOfWeek = idx % 7;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                className={cn(
                  "relative flex flex-col items-center py-1.5 min-h-[52px] border-b border-r border-border/10 transition-colors",
                  !cell.isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-primary/10',
                  isToday && !isSelected && 'bg-secondary/50',
                  cell.isCurrentMonth && 'hover:bg-secondary/30'
                )}
              >
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && 'bg-primary text-primary-foreground',
                  dayOfWeek === 0 && !isToday && 'text-rose-400',
                  dayOfWeek === 6 && !isToday && 'text-blue-400',
                )}>
                  {cell.day}
                </span>
                {/* Dots */}
                <div className="flex items-center gap-0.5 mt-0.5 h-2">
                  {hasTasks && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  {hasEvents && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  {hasLeaves && leavesByDate[cell.date].map((l, i) => (
                    <span key={i} className={cn("w-1.5 h-1.5 rounded-full", getLeaveColor(l.type))} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!hasSelectedItems && (
              <p className="text-xs text-muted-foreground text-center py-3">일정이 없습니다</p>
            )}

            {/* Tasks */}
            {selectedTasks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-orange-400 flex items-center gap-1"><Briefcase className="h-3 w-3" /> 프로젝트 태스크</p>
                {selectedTasks.map((t, i) => (
                  <div key={i} className="text-xs pl-4 py-1 border-l-2 border-orange-400/30">
                    <span className="font-medium">{t.project}</span>
                    <span className="text-muted-foreground"> — {t.task}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Events */}
            {selectedEvents.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-blue-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> 일정</p>
                {selectedEvents.map(e => (
                  <div key={e.id} className="text-xs pl-4 py-1 border-l-2 border-blue-400/30">
                    <span className="font-medium">{e.title}</span>
                    {e.event_time && <span className="text-muted-foreground ml-1">{e.event_time}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Leaves */}
            {selectedLeaves.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-rose-400 flex items-center gap-1"><Palmtree className="h-3 w-3" /> 연차/휴가</p>
                {selectedLeaves.map(l => (
                  <div key={l.id} className="text-xs pl-4 py-1 border-l-2 border-rose-400/30 flex items-center gap-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium text-white", getLeaveColor(l.type))}>
                      {getLeaveLabel(l.type)}
                    </span>
                    <span className="font-medium">{l.profile?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
