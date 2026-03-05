import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Layers, Clock, ArrowLeft } from 'lucide-react';
import { DbItem } from '@/hooks/useDbItems';
import { DbCategory } from '@/hooks/useDbCategories';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Platform } from '@/types/pickstack';

interface DashboardProps {
  items: DbItem[];
  categories: DbCategory[];
  onClose: () => void;
}

export function Dashboard({ items, categories, onClose }: DashboardProps) {
  // Platform distribution
  const platformStats = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => map.set(i.platform, (map.get(i.platform) || 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [items]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; category: DbCategory | undefined }>();
    items.forEach(i => {
      const catId = i.category_id || 'uncategorized';
      const cat = categories.find(c => c.id === catId);
      const existing = map.get(catId);
      map.set(catId, { count: (existing?.count || 0) + 1, category: cat || existing?.category });
    });
    return [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [items, categories]);

  // Weekly trend (last 4 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (w + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - w * 7);
      const count = items.filter(i => {
        const d = new Date(i.created_at);
        return d >= start && d < end;
      }).length;
      weeks.push({ label: `${w === 0 ? '이번주' : `${w}주 전`}`, count });
    }
    return weeks;
  }, [items]);

  const maxWeekly = Math.max(...weeklyTrend.map(w => w.count), 1);
  const maxPlatform = Math.max(...platformStats.map(([, c]) => c), 1);
  const maxCategory = Math.max(...categoryStats.map(([, v]) => v.count), 1);

  // AI analysis stats
  const aiStats = useMemo(() => {
    const done = items.filter(i => i.ai_status === 'done').length;
    const pending = items.filter(i => i.ai_status === 'pending').length;
    const error = items.filter(i => i.ai_status === 'error').length;
    return { done, pending, error, total: items.length };
  }, [items]);

  // Recent activity (today / this week)
  const recentStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    
    return {
      today: items.filter(i => new Date(i.created_at) >= todayStart).length,
      thisWeek: items.filter(i => new Date(i.created_at) >= weekStart).length,
      total: items.length,
    };
  }, [items]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dock border-b-0">
        <div className="container flex items-center h-12 px-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="glass-button w-8 h-8 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">대시보드</h1>
          </div>
        </div>
      </header>

      <main className="container px-3 py-4 space-y-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '오늘', value: recentStats.today, icon: '📝' },
            { label: '이번주', value: recentStats.thisWeek, icon: '📅' },
            { label: '전체', value: recentStats.total, icon: '📚' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-3 text-center"
            >
              <span className="text-lg">{stat.icon}</span>
              <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-2xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">주간 저장 트렌드</h2>
          </div>
          <div className="flex items-end gap-2 h-24">
            {weeklyTrend.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-2xs font-bold text-foreground">{week.count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(week.count / maxWeekly) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="w-full rounded-t-lg min-h-[4px]"
                  style={{
                    background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--neon-pink)))`,
                  }}
                />
                <span className="text-2xs text-muted-foreground">{week.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-neon-cyan" />
            <h2 className="text-sm font-semibold text-foreground">플랫폼별 저장</h2>
          </div>
          <div className="space-y-2">
            {platformStats.map(([platform, count], i) => (
              <motion.div
                key={platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-2"
              >
                <PlatformIcon platform={platform as Platform} size="sm" />
                <span className="text-xs font-medium text-foreground w-16 truncate">{platform}</span>
                <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxPlatform) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-neon-purple" />
            <h2 className="text-sm font-semibold text-foreground">카테고리별 저장</h2>
          </div>
          <div className="space-y-2">
            {categoryStats.map(([catId, { count, category }], i) => (
              <motion.div
                key={catId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm">{category?.icon || '📁'}</span>
                <span className="text-xs font-medium text-foreground w-20 truncate">
                  {category?.name || '미분류'}
                </span>
                <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCategory) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: category?.color || 'hsl(var(--muted-foreground))',
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Analysis Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">AI 분석 현황</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="glass rounded-xl p-2">
              <p className="text-lg font-bold text-neon-cyan">{aiStats.done}</p>
              <p className="text-2xs text-muted-foreground">완료</p>
            </div>
            <div className="glass rounded-xl p-2">
              <p className="text-lg font-bold text-primary">{aiStats.pending}</p>
              <p className="text-2xs text-muted-foreground">대기중</p>
            </div>
            <div className="glass rounded-xl p-2">
              <p className="text-lg font-bold text-destructive">{aiStats.error}</p>
              <p className="text-2xs text-muted-foreground">오류</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
