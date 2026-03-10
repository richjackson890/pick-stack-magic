import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Plus, Sparkles, Lightbulb } from 'lucide-react';
import { useCreatorChannels, CreatorChannel } from '@/hooks/useCreatorChannels';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { PlatformIcon } from '@/components/PlatformIcon';
import { ChannelFormModal } from '@/components/ChannelFormModal';
import { IdeaEngine } from '@/components/IdeaEngine';
import { Platform } from '@/types/pickstack';

const DAY_LABELS: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일' };

export function CreatorMode() {
  const { channels, loading, addChannel, updateChannel, deleteChannel, canAddChannel, getMaxChannels } = useCreatorChannels();
  const { usageData } = useUsageLimits();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<CreatorChannel | null>(null);
  const [ideaChannel, setIdeaChannel] = useState<CreatorChannel | null>(null);

  // If idea engine is open, show it
  if (ideaChannel) {
    return <IdeaEngine channel={ideaChannel} onBack={() => setIdeaChannel(null)} />;
  }

  const handleOpenAdd = () => {
    if (!canAddChannel(usageData.isPremium)) return;
    setEditingChannel(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (channel: CreatorChannel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    platform: string;
    tone_keywords: string[];
    content_formula: string | null;
    posting_schedule: number[];
    target_hashtags: string[];
    color: string;
  }) => {
    if (editingChannel) {
      await updateChannel(editingChannel.id, data);
    } else {
      await addChannel(data);
    }
    setIsFormOpen(false);
    setEditingChannel(null);
  };

  const handleDelete = async () => {
    if (editingChannel) {
      await deleteChannel(editingChannel.id);
      setIsFormOpen(false);
      setEditingChannel(null);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dock border-b-0">
        <div className="container flex items-center h-12 px-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
              <PenTool className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Creator Mode</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">레퍼런스에서 콘텐츠를 만드세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-3 py-4 space-y-3">
        {/* Channel Count & Add Button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            채널 {channels.length}/{getMaxChannels(usageData.isPremium)}
            {!usageData.isPremium && <span className="ml-1 text-amber-500">(Pro: {getMaxChannels(true)}개)</span>}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenAdd}
            disabled={!canAddChannel(usageData.isPremium)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            채널 추가
          </motion.button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && channels.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-accent/60" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">아직 채널이 없어요</h3>
            <p className="text-xs text-muted-foreground text-center mb-5 max-w-[200px]">
              첫 채널을 등록하고 콘텐츠 아이디어를 만들어보세요
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              첫 채널 등록하기
            </motion.button>
          </motion.div>
        )}

        {/* Channel Cards */}
        {!loading && channels.map((channel, i) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-3.5"
          >
            <div className="flex items-start gap-3 cursor-pointer" onClick={() => handleOpenEdit(channel)}>
              {/* Platform Icon */}
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <PlatformIcon platform={channel.platform as Platform} size="md" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground truncate">{channel.name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{channel.platform}</span>
                </div>

                {/* Tone Keywords */}
                {channel.tone_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {channel.tone_keywords.slice(0, 4).map((kw, j) => (
                      <span key={j} className="glass-chip px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {kw}
                      </span>
                    ))}
                    {channel.tone_keywords.length > 4 && (
                      <span className="text-[10px] text-muted-foreground/60">+{channel.tone_keywords.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Schedule */}
                {channel.posting_schedule.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    📅 {channel.posting_schedule.map(d => DAY_LABELS[d]).join(' · ')}
                  </p>
                )}
              </div>

              {/* Color Dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: channel.color }}
              />
            </div>

            {/* Idea Generation Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                setIdeaChannel(channel);
              }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              아이디어 생성
            </motion.button>
          </motion.div>
        ))}
      </main>

      {/* Channel Form Modal */}
      <ChannelFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingChannel(null); }}
        onSave={handleSave}
        onDelete={editingChannel ? handleDelete : undefined}
        editChannel={editingChannel}
      />
    </div>
  );
}
