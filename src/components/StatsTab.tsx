import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { Heart, MessageCircle, Lightbulb, TrendingUp, Crown } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from 'recharts';

interface StatsTabProps {
  tips: Tip[];
  categories: ArchiCategory[];
  getCategoryById: (id: string | null) => ArchiCategory | undefined;
  commentCounts: Record<string, number>;
}

const CHART_COLORS = [
  'hsl(262, 83%, 58%)', // purple
  'hsl(187, 85%, 53%)', // cyan
  'hsl(24, 95%, 53%)',  // orange
  'hsl(330, 81%, 60%)', // pink
  'hsl(142, 71%, 45%)', // green
  'hsl(47, 96%, 53%)',  // yellow
  'hsl(210, 79%, 55%)', // blue
  'hsl(0, 72%, 51%)',   // red
];

export function StatsTab({ tips, categories, getCategoryById, commentCounts }: StatsTabProps) {
  const totalLikes = useMemo(() => tips.reduce((sum, t) => sum + (t.likes || 0), 0), [tips]);
  const totalComments = useMemo(() => Object.values(commentCounts).reduce((sum, c) => sum + c, 0), [commentCounts]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tips.forEach(tip => {
      const cat = getCategoryById(tip.category);
      const name = cat?.name || 'Uncategorized';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tips, getCategoryById]);

  // Last 7 days trend
  const trendData = useMemo(() => {
    const now = new Date();
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      days.push({ date: dateStr, label, count: 0 });
    }
    tips.forEach(tip => {
      const tipDate = tip.created_at.slice(0, 10);
      const day = days.find(d => d.date === tipDate);
      if (day) day.count++;
    });
    return days;
  }, [tips]);

  // Top 3 most liked
  const topTips = useMemo(() => {
    return [...tips].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);
  }, [tips]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 },
    }),
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-4 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Lightbulb, label: 'Tips', value: tips.length, color: 'text-yellow-400' },
          { icon: Heart, label: 'Likes', value: totalLikes, color: 'text-rose-400' },
          { icon: MessageCircle, label: 'Comments', value: totalComments, color: 'text-cyan-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="glass-card p-4 flex flex-col items-center gap-1.5"
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
            <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Category distribution - Donut chart */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full gradient-primary inline-block" />
          Category Distribution
        </h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No data</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-1/2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 7-day trend - Area chart */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Last 7 Days
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} tips`, 'Count']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={{ r: 4, fill: 'hsl(262, 83%, 58%)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'hsl(262, 83%, 58%)', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top 3 most liked */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-400" />
          Most Liked Tips
        </h3>
        {topTips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No tips yet</p>
        ) : (
          <div className="space-y-3">
            {topTips.map((tip, idx) => {
              const cat = getCategoryById(tip.category);
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                >
                  <span className="text-xl shrink-0">{medals[idx]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{tip.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cat && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: cat.color + '20', color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Heart className="h-3 w-3 text-rose-400" /> {tip.likes}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
