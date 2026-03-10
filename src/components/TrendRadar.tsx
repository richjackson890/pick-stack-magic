import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, Flame, Lock, Home, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits } from '@/hooks/useUsageLimits';

interface TrendRadarProps {
  onNavigateToIdea?: (keywords: string) => void;
  onNavigateHome?: () => void;
}

interface KeywordCount {
  keyword: string;
  count: number;
}

interface RisingKeyword {
  keyword: string;
  thisWeek: number;
  lastWeek: number;
  changePercent: number | null; // null means NEW
}

export function TrendRadar({ onNavigateToIdea, onNavigateHome }: TrendRadarProps) {
  const { user } = useAuth();
  const { usageData } = useUsageLimits();
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [hotKeywords, setHotKeywords] = useState<KeywordCount[]>([]);
  const [risingKeywords, setRisingKeywords] = useState<RisingKeyword[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTrends();
  }, [user]);

  const fetchTrends = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Fetch all items from the past 2 weeks
      const { data: items, error } = await supabase
        .from('items')
        .select('tags, core_keywords, created_at')
        .eq('user_id', user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also get total count
      const { count } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalItems(count || 0);

      if (!items || items.length === 0) {
        setHotKeywords([]);
        setRisingKeywords([]);
        setLoading(false);
        return;
      }

      // Split into this week vs last week
      const thisWeekItems = items.filter(i => new Date(i.created_at) >= weekAgo);
      const lastWeekItems = items.filter(i => {
        const d = new Date(i.created_at);
        return d >= twoWeeksAgo && d < weekAgo;
      });

      // Count keywords
      const countKeywords = (itemList: typeof items) => {
        const counts: Record<string, number> = {};
        for (const item of itemList) {
          const allKws = [
            ...(item.tags || []),
            ...(item.core_keywords || []),
          ];
          for (const kw of allKws) {
            const clean = kw.trim().toLowerCase();
            if (clean && clean.length > 1) {
              counts[clean] = (counts[clean] || 0) + 1;
            }
          }
        }
        return counts;
      };

      const thisWeekCounts = countKeywords(thisWeekItems);
      const lastWeekCounts = countKeywords(lastWeekItems);

      // Hot keywords (this week top 10)
      const hot: KeywordCount[] = Object.entries(thisWeekCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setHotKeywords(hot);

      // Rising keywords
      const allThisWeekKws = Object.keys(thisWeekCounts);
      const rising: RisingKeyword[] = allThisWeekKws
        .map(keyword => {
          const thisWeek = thisWeekCounts[keyword] || 0;
          const lastWeek = lastWeekCounts[keyword] || 0;
          if (lastWeek === 0) {
            return { keyword, thisWeek, lastWeek, changePercent: null }; // NEW
          }
          const changePercent = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
          return { keyword, thisWeek, lastWeek, changePercent };
        })
        .filter(r => r.changePercent === null || r.changePercent > 0)
        .sort((a, b) => {
          // NEW items first, then by change percent
          if (a.changePercent === null && b.changePercent === null) return b.thisWeek - a.thisWeek;
          if (a.changePercent === null) return -1;
          if (b.changePercent === null) return 1;
          return b.changePercent - a.changePercent;
        })
        .slice(0, 5);
      setRisingKeywords(rising);
    } catch (err) {
      console.error('Trend fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Content opportunity combinations from top 3 hot keywords
  const opportunities = useMemo(() => {
    if (hotKeywords.length < 2) return [];
    const top = hotKeywords.slice(0, 3);
    const combos: { kw1: string; kw2: string }[] = [];
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        combos.push({ kw1: top[i].keyword, kw2: top[j].keyword });
      }
    }
    return combos.slice(0, 3);
  }, [hotKeywords]);

  // Font size for tag cloud
  const getTagSize = (count: number) => {
    if (hotKeywords.length === 0) return 'text-xs';
    const max = hotKeywords[0]?.count || 1;
    const ratio = count / max;
    if (ratio > 0.8) return 'text-base font-bold';
    if (ratio > 0.5) return 'text-sm font-semibold';
    if (ratio > 0.3) return 'text-xs font-medium';
    return 'text-[11px]';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Empty state
  if (totalItems < 5) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-4">
          <TrendingUp className="h-10 w-10 text-accent/60" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">콘텐츠를 더 저장하면 트렌드를 분석할 수 있어요 📊</h3>
        <p className="text-xs text-muted-foreground text-center mb-5 max-w-[240px]">
          홈에서 관심 있는 콘텐츠를 저장해보세요
        </p>
        {onNavigateHome && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground"
          >
            <Home className="h-4 w-4" />
            홈으로 이동
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hot Keywords */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-bold text-foreground">이번 주 핫 키워드</h3>
        </div>

        {hotKeywords.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">이번 주 저장된 콘텐츠가 없습니다</p>
        ) : (
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {hotKeywords.map((kw, i) => (
                <motion.span
                  key={kw.keyword}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary cursor-default transition-colors hover:bg-primary/20 ${getTagSize(kw.count)}`}
                >
                  {kw.keyword}
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                    {kw.count}
                  </span>
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Rising Topics */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">상승 주제</h3>
        </div>

        {risingKeywords.length === 0 ? (
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground text-center">
              2주 이상 콘텐츠를 저장하면 트렌드가 보여요
            </p>
          </div>
        ) : (
          <div className="glass-card p-3 space-y-1.5">
            {risingKeywords.map((rk, i) => (
              <motion.div
                key={rk.keyword}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{rk.keyword}</span>
                  <span className="text-[10px] text-muted-foreground">
                    이번 주 {rk.thisWeek}회
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {rk.changePercent === null ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent">
                      NEW
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="h-3 w-3" />
                      +{rk.changePercent}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Content Opportunities */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">추천 콘텐츠 기회</h3>
        </div>

        <div className="relative">
          {!usageData.isPremium && (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Pro로 업그레이드하면 AI 추천을 볼 수 있어요</p>
              <p className="text-[10px] text-muted-foreground">트렌드 기반 콘텐츠 기회를 확인하세요</p>
            </div>
          )}

          <div className={`glass-card p-3 space-y-2 ${!usageData.isPremium ? 'select-none' : ''}`}>
            {opportunities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">키워드가 부족합니다</p>
            ) : (
              opportunities.map((opp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-muted/30"
                >
                  <p className="text-xs text-foreground">
                    🔥 &apos;{opp.kw1}&apos; + &apos;{opp.kw2}&apos; 조합으로 콘텐츠를 만들어보세요
                  </p>
                  {onNavigateToIdea && usageData.isPremium && (
                    <button
                      onClick={() => onNavigateToIdea(`${opp.kw1}, ${opp.kw2}`)}
                      className="shrink-0 text-[10px] font-semibold text-accent hover:underline ml-2"
                    >
                      → 아이디어 만들기
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
