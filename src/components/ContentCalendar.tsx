import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Trash2, CalendarDays, FileEdit, ChevronDown, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorChannels, CreatorChannel } from '@/hooks/useCreatorChannels';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DraftModal } from '@/components/DraftModal';

interface ContentIdea {
  id: string;
  title: string;
  hook: string | null;
  format: string | null;
  content_layers: { layer_name: string; description: string }[];
  hashtags: string[];
  estimated_engagement: string | null;
  channel_id: string | null;
  status: string | null;
  scheduled_date: string | null;
  draft_content: string | null;
}

const DAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일'];

const STATUS_EMOJI: Record<string, string> = {
  idea: '⚪',
  drafted: '🟡',
  posted: '🟢',
};

const STATUS_OPTIONS = [
  { value: 'idea', label: '⚪ 아이디어' },
  { value: 'drafted', label: '🟡 초안 작성됨' },
  { value: 'posted', label: '🟢 게시 완료' },
];

const FORMAT_LABELS: Record<string, string> = {
  carousel: '캐러셀',
  reel: '릴스',
  thread: '스레드',
  long_form: '롱폼',
};

const ENGAGEMENT_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  mid: { label: 'Mid', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // JS: 0=Sun, we want 0=Mon
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Next month fill
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - startDow - lastDay.getDate() + 1);
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
}

function dateToString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ContentCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { channels } = useCreatorChannels();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannelId, setFilterChannelId] = useState<string | null>(null);

  // Modals
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [assignDate, setAssignDate] = useState<string | null>(null); // date string for assigning unscheduled ideas
  const [unscheduledIdeas, setUnscheduledIdeas] = useState<ContentIdea[]>([]);

  // Fetch ideas for the visible range
  const fetchIdeas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const mapped: ContentIdea[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        hook: r.hook,
        format: r.format,
        content_layers: Array.isArray(r.content_layers) ? r.content_layers : [],
        hashtags: r.hashtags || [],
        estimated_engagement: r.estimated_engagement,
        channel_id: r.channel_id,
        status: r.status,
        scheduled_date: r.scheduled_date,
        draft_content: r.draft_content || null,
      }));
      setIdeas(mapped);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount & month change
  useState(() => { fetchIdeas(); });

  const todayStr = dateToString(new Date());
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const filteredIdeas = useMemo(() => {
    if (!filterChannelId) return ideas;
    return ideas.filter(i => i.channel_id === filterChannelId);
  }, [ideas, filterChannelId]);

  const ideasByDate = useMemo(() => {
    const map: Record<string, ContentIdea[]> = {};
    for (const idea of filteredIdeas) {
      if (idea.scheduled_date) {
        if (!map[idea.scheduled_date]) map[idea.scheduled_date] = [];
        map[idea.scheduled_date].push(idea);
      }
    }
    return map;
  }, [filteredIdeas]);

  const channelMap = useMemo(() => {
    const m: Record<string, CreatorChannel> = {};
    for (const c of channels) m[c.id] = c;
    return m;
  }, [channels]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleCellClick = (dateStr: string, cellIdeas: ContentIdea[]) => {
    if (cellIdeas.length > 0) {
      // Show first idea detail (could expand to list later)
      setSelectedIdea(cellIdeas[0]);
    } else {
      // Show unscheduled ideas to assign
      const unscheduled = filteredIdeas.filter(i => !i.scheduled_date && (i.status === 'idea' || i.status === null));
      if (unscheduled.length === 0) {
        toast({ title: '배치할 아이디어가 없습니다', description: '먼저 아이디어를 생성해주세요.' });
        return;
      }
      setUnscheduledIdeas(unscheduled);
      setAssignDate(dateStr);
    }
  };

  const handleAssignIdea = async (ideaId: string) => {
    if (!assignDate) return;
    const { error } = await supabase
      .from('content_ideas')
      .update({ scheduled_date: assignDate })
      .eq('id', ideaId);
    if (error) {
      toast({ title: '날짜 지정 실패', variant: 'destructive' });
      return;
    }
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, scheduled_date: assignDate } : i));
    setAssignDate(null);
    setUnscheduledIdeas([]);
    toast({ title: '아이디어가 배치되었습니다' });
  };

  const handleUpdateStatus = async (ideaId: string, status: string) => {
    const { error } = await supabase
      .from('content_ideas')
      .update({ status })
      .eq('id', ideaId);
    if (error) {
      toast({ title: '상태 변경 실패', variant: 'destructive' });
      return;
    }
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status } : i));
    setSelectedIdea(prev => prev && prev.id === ideaId ? { ...prev, status } : prev);
    toast({ title: '상태가 변경되었습니다' });
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const { error } = await supabase.from('content_ideas').delete().eq('id', ideaId);
    if (error) {
      toast({ title: '삭제 실패', variant: 'destructive' });
      return;
    }
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    setSelectedIdea(null);
    toast({ title: '아이디어가 삭제되었습니다' });
  };

  const handleReschedule = async (ideaId: string) => {
    // Remove schedule so it can be re-assigned
    const { error } = await supabase
      .from('content_ideas')
      .update({ scheduled_date: null })
      .eq('id', ideaId);
    if (error) {
      toast({ title: '변경 실패', variant: 'destructive' });
      return;
    }
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, scheduled_date: null } : i));
    setSelectedIdea(null);
    toast({ title: '날짜가 해제되었습니다. 다른 날짜를 클릭하여 재배치하세요.' });
  };

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <div className="space-y-3">
      {/* Channel filter chips */}
      {channels.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterChannelId(null)}
            className={`glass-chip px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors ${!filterChannelId ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-muted-foreground'}`}
          >
            전체
          </button>
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setFilterChannelId(ch.id === filterChannelId ? null : ch.id)}
              className={`glass-chip px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${filterChannelId === ch.id ? 'ring-1 ring-primary/30' : 'text-muted-foreground'}`}
              style={filterChannelId === ch.id ? { backgroundColor: `${ch.color}20`, color: ch.color } : {}}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
              {ch.name}
            </button>
          ))}
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h2 className="text-sm font-bold text-foreground">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="glass-card p-2 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {days.map(({ date, isCurrentMonth }, idx) => {
            const ds = dateToString(date);
            const cellIdeas = ideasByDate[ds] || [];
            const isToday = ds === todayStr;

            return (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => isCurrentMonth && handleCellClick(ds, cellIdeas)}
                className={`relative min-h-[52px] p-1 border border-border/30 cursor-pointer transition-colors hover:bg-muted/30 ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isToday ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
              >
                <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {date.getDate()}
                </span>
                {/* Idea dots */}
                {cellIdeas.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {cellIdeas.slice(0, 2).map(idea => {
                      const ch = idea.channel_id ? channelMap[idea.channel_id] : null;
                      return (
                        <div key={idea.id} className="flex items-center gap-0.5">
                          <span className="text-[8px]">{STATUS_EMOJI[idea.status || 'idea'] || '⚪'}</span>
                          {ch && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />}
                          <span className="text-[8px] text-foreground truncate leading-tight">{idea.title}</span>
                        </div>
                      );
                    })}
                    {cellIdeas.length > 2 && (
                      <span className="text-[8px] text-muted-foreground">+{cellIdeas.length - 2}</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Idea Detail Modal */}
      <Dialog open={!!selectedIdea} onOpenChange={(open) => { if (!open) setSelectedIdea(null); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{selectedIdea?.title}</DialogTitle>
            <DialogDescription className="text-[10px]">아이디어 상세</DialogDescription>
          </DialogHeader>
          {selectedIdea && (
            <div className="space-y-3">
              {/* Hook */}
              {selectedIdea.hook && (
                <div className="border-l-2 border-accent/50 pl-3">
                  <p className="text-xs text-muted-foreground italic">"{selectedIdea.hook}"</p>
                </div>
              )}

              {/* Format + Engagement */}
              <div className="flex flex-wrap gap-1.5">
                {selectedIdea.format && (
                  <span className="glass-chip px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {FORMAT_LABELS[selectedIdea.format] || selectedIdea.format}
                  </span>
                )}
                {selectedIdea.estimated_engagement && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${(ENGAGEMENT_CONFIG[selectedIdea.estimated_engagement] || ENGAGEMENT_CONFIG.mid).className}`}>
                    {(ENGAGEMENT_CONFIG[selectedIdea.estimated_engagement] || ENGAGEMENT_CONFIG.mid).label}
                  </span>
                )}
              </div>

              {/* Content Layers */}
              {selectedIdea.content_layers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">콘텐츠 구성</p>
                  {selectedIdea.content_layers.map((layer, j) => (
                    <div key={j} className="flex gap-2 text-xs">
                      <span className="text-primary font-semibold shrink-0">L{j + 1}</span>
                      <div>
                        <span className="font-medium text-foreground">{layer.layer_name}</span>
                        <span className="text-muted-foreground"> — {layer.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {selectedIdea.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedIdea.hashtags.map((tag, j) => (
                    <span key={j} className="text-[10px] text-accent">#{tag.replace(/^#/, '')}</span>
                  ))}
                </div>
              )}

              {/* Status change */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold">상태 변경</p>
                <Select
                  value={selectedIdea.status || 'idea'}
                  onValueChange={(val) => handleUpdateStatus(selectedIdea.id, val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => handleReschedule(selectedIdea.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <CalendarDays className="h-3 w-3" />
                  날짜 변경
                </button>
                <button
                  disabled
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <FileEdit className="h-3 w-3" />
                  초안 생성
                </button>
                <button
                  onClick={() => handleDeleteIdea(selectedIdea.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Unscheduled Ideas Modal */}
      <Dialog open={!!assignDate} onOpenChange={(open) => { if (!open) { setAssignDate(null); setUnscheduledIdeas([]); } }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">아이디어 배치</DialogTitle>
            <DialogDescription className="text-[10px]">{assignDate} 에 배치할 아이디어를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {unscheduledIdeas.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">배치 가능한 아이디어가 없습니다</p>
            ) : (
              unscheduledIdeas.map(idea => {
                const ch = idea.channel_id ? channelMap[idea.channel_id] : null;
                return (
                  <motion.button
                    key={idea.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAssignIdea(idea.id)}
                    className="w-full glass-card p-2.5 text-left hover:ring-1 hover:ring-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {ch && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{idea.title}</p>
                        {ch && <p className="text-[10px] text-muted-foreground">{ch.name}</p>}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
