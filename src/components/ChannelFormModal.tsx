import { useState, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { PlatformIcon } from '@/components/PlatformIcon';
import { CreatorChannel } from '@/hooks/useCreatorChannels';
import { cn } from '@/lib/utils';

const PLATFORMS = ['Instagram', 'Threads', 'YouTube', 'Blog', 'TikTok'] as const;
const DAYS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];
const PRESET_COLORS = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];

interface ChannelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    platform: string;
    tone_keywords: string[];
    content_formula: string | null;
    posting_schedule: number[];
    target_hashtags: string[];
    color: string;
  }) => void;
  onDelete?: () => void;
  editChannel?: CreatorChannel | null;
}

export function ChannelFormModal({ isOpen, onClose, onSave, onDelete, editChannel }: ChannelFormModalProps) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [toneKeywords, setToneKeywords] = useState<string[]>([]);
  const [toneInput, setToneInput] = useState('');
  const [contentFormula, setContentFormula] = useState('');
  const [postingSchedule, setPostingSchedule] = useState<number[]>([]);
  const [targetHashtags, setTargetHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [color, setColor] = useState('#4A90D9');

  useEffect(() => {
    if (editChannel) {
      setName(editChannel.name);
      setPlatform(editChannel.platform);
      setToneKeywords(editChannel.tone_keywords);
      setContentFormula(editChannel.content_formula || '');
      setPostingSchedule(editChannel.posting_schedule);
      setTargetHashtags(editChannel.target_hashtags);
      setColor(editChannel.color);
    } else {
      setName('');
      setPlatform('Instagram');
      setToneKeywords([]);
      setToneInput('');
      setContentFormula('');
      setPostingSchedule([]);
      setTargetHashtags([]);
      setHashtagInput('');
      setColor('#4A90D9');
    }
  }, [editChannel, isOpen]);

  const handleToneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && toneInput.trim()) {
      e.preventDefault();
      if (!toneKeywords.includes(toneInput.trim())) {
        setToneKeywords([...toneKeywords, toneInput.trim()]);
      }
      setToneInput('');
    }
  };

  const handleHashtagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (!targetHashtags.includes(tag)) {
        setTargetHashtags([...targetHashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const toggleDay = (day: number) => {
    setPostingSchedule(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      platform,
      tone_keywords: toneKeywords,
      content_formula: contentFormula.trim() || null,
      posting_schedule: postingSchedule,
      target_hashtags: targetHashtags,
      color,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-3 top-[5%] bottom-[5%] z-50 max-w-md mx-auto"
      >
        <div className="h-full glass rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h2 className="text-base font-bold text-foreground">
              {editChannel ? '채널 수정' : '새 채널 등록'}
            </h2>
            <button onClick={onClose} className="glass-button w-8 h-8 flex items-center justify-center rounded-full">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-glass">
            {/* Channel Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">채널명</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 돈되는집의비밀"
                className="w-full glass-chip px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">플랫폼</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      platform === p
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                        : 'glass-chip text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <PlatformIcon platform={p as any} size="xs" />
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Keywords */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">톤앤매너 키워드</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {toneKeywords.map((kw, i) => (
                  <span key={i} className="glass-chip px-2 py-1 text-xs flex items-center gap-1">
                    {kw}
                    <button onClick={() => setToneKeywords(toneKeywords.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={toneInput}
                onChange={e => setToneInput(e.target.value)}
                onKeyDown={handleToneKeyDown}
                placeholder="키워드 입력 후 Enter"
                className="w-full glass-chip px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Posting Schedule */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">포스팅 요일</label>
              <div className="flex gap-1.5">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'w-9 h-9 rounded-xl text-xs font-semibold transition-all',
                      postingSchedule.includes(day.value)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'glass-chip text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Hashtags */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">타겟 해시태그</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {targetHashtags.map((tag, i) => (
                  <span key={i} className="glass-chip px-2 py-1 text-xs flex items-center gap-1">
                    #{tag}
                    <button onClick={() => setTargetHashtags(targetHashtags.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="#해시태그 입력 후 Enter"
                className="w-full glass-chip px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Content Formula */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">콘텐츠 공식</label>
              <textarea
                value={contentFormula}
                onChange={e => setContentFormula(e.target.value)}
                placeholder="예: Layer1: 경제데이터 → Layer2: 건축분석 → Layer3: 풍수 적용"
                rows={3}
                className="w-full glass-chip px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">채널 색상</label>
              <div className="flex gap-2.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 12px ${c}60` : undefined }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/30 flex gap-2">
            {editChannel && onDelete && (
              <button
                onClick={onDelete}
                className="glass-button px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 glass-button px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              {editChannel ? '수정' : '등록'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
