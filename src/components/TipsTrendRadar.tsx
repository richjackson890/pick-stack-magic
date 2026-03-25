import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { BarChart3, Hash, Users, TrendingUp, Flame } from 'lucide-react';

interface TipsTrendRadarProps {
  tips: Tip[];
  categories: ArchiCategory[];
  getCategoryById: (id: string | null) => ArchiCategory | undefined;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'scale': '⚖',
  'trending-up': '📈',
  'palette': '🎨',
  'building': '🏗',
  'folder': '📁',
  'robot': '🤖',
};

export function TipsTrendRadar({ tips, categories, getCategoryById }: TipsTrendRadarProps) {
  // Category distribution
  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    tips.forEach(tip => {
      const catId = tip.category || 'none';
      counts.set(catId, (counts.get(catId) || 0) + 1);
    });

    return categories
      .map(cat => ({
        category: cat,
        count: counts.get(cat.id) || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tips, categories]);

  const maxCategoryCount = Math.max(...categoryStats.map(s => s.count), 1);

  // Hot tags this week
  const hotTags = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tagCounts = new Map<string, number>();

    tips
      .filter(t => new Date(t.created_at) >= weekAgo)
      .forEach(tip => {
        // User tags
        tip.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
        // AI tags
        tip.ai_tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }, [tips]);

  const maxTagCount = Math.max(...hotTags.map(t => t.count), 1);

  // Team activity — tips per day for last 7 days
  const dailyActivity = useMemo(() => {
    const days: { label: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('ko-KR', { weekday: 'short' });
      days.push({ label: dayLabel, date: dateStr, count: 0 });
    }

    tips.forEach(tip => {
      const dateStr = tip.created_at.slice(0, 10);
      const day = days.find(d => d.date === dateStr);
      if (day) day.count++;
    });

    return days;
  }, [tips]);

  const maxDailyCount = Math.max(...dailyActivity.map(d => d.count), 1);

  // Top contributors
  const topContributors = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const counts = new Map<string, { name: string; avatar: string | null; count: number }>();

    tips
      .filter(t => new Date(t.created_at) >= weekAgo)
      .forEach(tip => {
        const name = tip.profiles?.name || tip.profiles?.email?.split('@')[0] || 'Unknown';
        const existing = counts.get(tip.user_id);
        if (existing) {
          existing.count++;
        } else {
          counts.set(tip.user_id, {
            name,
            avatar: tip.profiles?.avatar_url || null,
            count: 1,
          });
        }
      });

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tips]);

  return (
    <div className="min-h-screen pb-24">
      <div className="container px-3 pt-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Trend Radar</h2>
            <p className="text-xs text-muted-foreground">팀 활동 분석 · 총 {tips.length}개 팁</p>
          </div>
        </div>

        {/* Category Distribution */}
        <section className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            카테고리별 분포
          </h3>
          <div className="space-y-2.5">
            {categoryStats.map(({ category: cat, count }, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {CATEGORY_EMOJI[cat.icon] || '📁'}
                    </span>
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Hot Tags This Week */}
        <section className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            이번 주 인기 태그
          </h3>
          {hotTags.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">이번 주 태그가 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hotTags.map(({ tag, count }, i) => {
                const intensity = count / maxTagCount;
                const size = intensity > 0.7 ? 'text-sm' : intensity > 0.4 ? 'text-xs' : 'text-[11px]';
                return (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${size}`}
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${0.08 + intensity * 0.15})`,
                      color: `hsl(var(--primary))`,
                    }}
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                    <span className="text-[9px] opacity-60">×{count}</span>
                  </motion.span>
                );
              })}
            </div>
          )}
        </section>

        {/* Team Activity — Daily bar chart */}
        <section className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            팀 활동 (최근 7일)
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {dailyActivity.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{day.count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((day.count / maxDailyCount) * 100, 4)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="w-full rounded-t-md bg-primary/70 min-h-[4px]"
                />
                <span className="text-[10px] text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Contributors */}
        <section className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            이번 주 기여자
          </h3>
          {topContributors.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">이번 주 활동이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {topContributors.map((contributor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  {contributor.avatar ? (
                    <img src={contributor.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium flex-1">{contributor.name}</span>
                  <span className="text-xs text-muted-foreground">{contributor.count} tips</span>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
