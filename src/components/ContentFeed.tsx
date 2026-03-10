import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2, Rss, Lightbulb, Lock, Flame, TrendingUp, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCreatorChannels, CreatorChannel } from '@/hooks/useCreatorChannels';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useToast } from '@/hooks/use-toast';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Platform } from '@/types/pickstack';
import { Badge } from '@/components/ui/badge';

interface FeedItem {
  title: string;
  summary: string;
  angle: string;
  urgency: 'hot' | 'trending' | 'evergreen';
}

interface ContentFeedProps {
  onNavigateToIdea: (keywords: string) => void;
}

const URGENCY_CONFIG = {
  hot: { label: 'HOT', icon: Flame, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  trending: { label: 'Trending', icon: TrendingUp, className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  evergreen: { label: 'Evergreen', icon: Leaf, className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

export function ContentFeed({ onNavigateToIdea }: ContentFeedProps) {
  const { channels } = useCreatorChannels();
  const { usageData } = useUsageLimits();
  const { toast } = useToast();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const selectedChannel = channels.find(c => c.id === selectedChannelId) || null;

  const handleGenerate = async (channelId: string) => {
    setLoading(true);
    setFeedItems([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-feed', {
        body: { channel_id: channelId },
      });

      if (error) throw error;

      if (data?.error === 'daily_limit') {
        toast({ title: '일일 제한', description: data.message, variant: 'destructive' });
        return;
      }

      if (data?.feed) {
        setFeedItems(data.feed);
        setHasGenerated(true);
      }
    } catch (err: any) {
      console.error('Feed generation error:', err);
      toast({ title: '피드 생성 실패', description: '다시 시도해주세요', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChannel = (channel: CreatorChannel) => {
    setSelectedChannelId(channel.id);
    setFeedItems([]);
    setHasGenerated(false);
    handleGenerate(channel.id);
  };

  // Empty state - no channels
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-4">
          <Rss className="h-10 w-10 text-accent/60" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">채널을 먼저 등록해주세요</h3>
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          채널을 등록하면 맞춤 콘텐츠 피드를 받을 수 있어요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Channel Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => handleSelectChannel(channel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedChannelId === channel.id
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <PlatformIcon platform={channel.platform as Platform} size="sm" />
            {channel.name}
          </button>
        ))}
      </div>

      {/* No channel selected */}
      {!selectedChannelId && !loading && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <Rss className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">채널을 선택하면 맞춤 피드를 생성해요</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">AI가 최신 콘텐츠 기회를 찾고 있어요...</p>
        </div>
      )}

      {/* Feed Items */}
      {!loading && feedItems.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{feedItems.length}개의 콘텐츠 기회</p>
            <button
              onClick={() => selectedChannelId && handleGenerate(selectedChannelId)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              새로고침
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {feedItems.map((item, i) => {
              const urgency = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.evergreen;
              const UrgencyIcon = urgency.icon;
              return (
                <motion.div
                  key={`${item.title}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground leading-snug flex-1">{item.title}</h3>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0.5 ${urgency.className}`}>
                      <UrgencyIcon className="h-3 w-3 mr-0.5" />
                      {urgency.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>

                  <div className="bg-muted/30 rounded-lg px-2.5 py-1.5">
                    <p className="text-[11px] text-foreground/80">
                      <span className="font-semibold text-accent">앵글:</span> {item.angle}
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigateToIdea(item.title)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    이걸로 아이디어 만들기
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}

      {/* Generated but empty */}
      {!loading && hasGenerated && feedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <p className="text-sm text-muted-foreground mb-3">피드를 생성하지 못했어요</p>
          <button
            onClick={() => selectedChannelId && handleGenerate(selectedChannelId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
