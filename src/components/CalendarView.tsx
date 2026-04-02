import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  return days;
}

function getLeaveColorBg(type: string) {
  if (type === '연차') return 'bg-rose-500/15 text-rose-500';
  if (type === '오전반차' || type === '오후반차') return 'bg-amber-500/15 text-amber-600';
  return 'bg-emerald-500/15 text-emerald-600';
}

function getLeaveLabel(type: string) {
  if (type === '연차') return '연차';
  if (type === '오전반차') return '오전반';
  if (type === '오후반차') return '오후반';
  if (type === '오전반반차') return '오전반반';
  if (type === '오후반반차') return '오후반반';
  return type;
}

export function CalendarView({ projects, events, leaves }: CalendarViewProps) {
  // Use KST date to match the rest of the app
  const now = new Date();
  const kstOffset = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = new Date(kstOffset.toISOString().split('T')[0] + 'T00:00:00');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const rowCount = days.length / 7;

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

  // Detail for selected date
  const selTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const selEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const selLeaves = selectedDate ? (leavesByDate[selectedDate] || []) : [];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{year}년 {month + 1}월</h2>
          <button onClick={goToday} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground hover:text-primary hover:border-primary transition-colors">오늘</button>
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/30 shrink-0">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={cn("text-center py-1.5 text-[11px] font-semibold", i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground')}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid — fills remaining space */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
        {days.map((cell, idx) => {
          const dateTasks = tasksByDate[cell.date] || [];
          const dateEvents = eventsByDate[cell.date] || [];
          const dateLeaves = leavesByDate[cell.date] || [];
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === selectedDate;
          const dayOfWeek = idx % 7;
          const hasContent = dateTasks.length + dateEvents.length + dateLeaves.length > 0;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(isSelected ? null : cell.date)}
              className={cn(
                "relative flex flex-col items-stretch p-1 border-b border-r border-border/10 text-left overflow-hidden transition-colors",
                !cell.isCurrentMonth && 'opacity-25',
                isSelected && 'bg-primary/10 ring-1 ring-primary/30 ring-inset',
                isToday && !isSelected && 'bg-primary/5',
                cell.isCurrentMonth && !isSelected && 'hover:bg-secondary/20'
              )}
            >
              {/* Day number */}
              <span className={cn(
                "text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0 self-start",
                isToday && 'bg-primary text-primary-foreground',
                dayOfWeek === 0 && !isToday && 'text-rose-400',
                dayOfWeek === 6 && !isToday && 'text-blue-400',
              )}>
                {cell.day}
              </span>

              {/* Content labels */}
              {cell.isCurrentMonth && hasContent && (
                <div className="flex flex-col gap-[2px] mt-0.5 min-w-0 overflow-hidden flex-1">
                  {dateTasks.slice(0, 2).map((t, i) => (
                    <div key={`t${i}`} className="text-[9px] leading-tight px-1 py-[1px] rounded bg-orange-500/15 text-orange-600 truncate">
                      {t.project} — {t.task}
                    </div>
                  ))}
                  {dateTasks.length > 2 && (
                    <div className="text-[8px] text-orange-400 px-1">+{dateTasks.length - 2}</div>
                  )}
                  {dateEvents.slice(0, 2).map((e, i) => (
                    <div key={`e${i}`} className="text-[9px] leading-tight px-1 py-[1px] rounded bg-blue-500/15 text-blue-500 truncate">
                      {e.title}
                    </div>
                  ))}
                  {dateEvents.length > 2 && (
                    <div className="text-[8px] text-blue-400 px-1">+{dateEvents.length - 2}</div>
                  )}
                  {dateLeaves.slice(0, 2).map((l, i) => (
                    <div key={`l${i}`} className={cn("text-[9px] leading-tight px-1 py-[1px] rounded truncate", getLeaveColorBg(l.type))}>
                      {getLeaveLabel(l.type)} {l.profile?.name || ''}
                    </div>
                  ))}
                  {dateLeaves.length > 2 && (
                    <div className="text-[8px] text-rose-400 px-1">+{dateLeaves.length - 2}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Popover detail for selected date */}
      <AnimatePresence>
        {selectedDate && (selTasks.length + selEvents.length + selLeaves.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-2 right-2 z-40 mx-auto max-w-lg glass-card rounded-xl p-4 space-y-2 shadow-xl border border-border/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {selTasks.length > 0 && (
              <div className="space-y-1">
                {selTasks.map((t, i) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    <span className="font-medium">{t.project}</span>
                    <span className="text-muted-foreground truncate">{t.task}</span>
                  </div>
                ))}
              </div>
            )}

            {selEvents.length > 0 && (
              <div className="space-y-1">
                {selEvents.map(e => (
                  <div key={e.id} className="text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="font-medium">{e.title}</span>
                    {e.event_time && <span className="text-muted-foreground">{e.event_time}</span>}
                  </div>
                ))}
              </div>
            )}

            {selLeaves.length > 0 && (
              <div className="space-y-1">
                {selLeaves.map(l => (
                  <div key={l.id} className="text-xs flex items-center gap-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", getLeaveColorBg(l.type))}>
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
