import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, FileEdit, RefreshCw, Loader2, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface DraftModalProps {
  open: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
  ideaFormat: string | null;
  channelName: string;
  existingDraft: string | null;
  onDraftGenerated: (ideaId: string, draft: string) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  carousel: '캐러셀',
  reel: '릴스',
  thread: '스레드',
  long_form: '롱폼',
};

export function DraftModal({
  open,
  onClose,
  ideaId,
  ideaTitle,
  ideaFormat,
  channelName,
  existingDraft,
  onDraftGenerated,
}: DraftModalProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<string | null>(existingDraft);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-draft', {
        body: { idea_id: ideaId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const content = data.draft_content;
      setDraft(content);
      onDraftGenerated(ideaId, content);
      toast({ title: '초안이 생성되었습니다!' });
    } catch (err: any) {
      console.error('Draft generation error:', err);
      toast({ title: '초안 생성 실패', description: err.message || '다시 시도해주세요.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    toast({ title: '클립보드에 복사되었습니다' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditText(draft || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('content_ideas')
      .update({ draft_content: editText })
      .eq('id', ideaId);

    if (error) {
      toast({ title: '저장 실패', variant: 'destructive' });
      return;
    }
    setDraft(editText);
    setIsEditing(false);
    onDraftGenerated(ideaId, editText);
    toast({ title: '초안이 저장되었습니다' });
  };

  // Auto-generate if no existing draft
  const showGeneratePrompt = !draft && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setIsEditing(false); onClose(); } }}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            {ideaTitle}
            {ideaFormat && (
              <span className="glass-chip px-2 py-0.5 text-[10px] font-semibold text-primary">
                {FORMAT_LABELS[ideaFormat] || ideaFormat}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-[10px]">{channelName} · 콘텐츠 초안</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-accent animate-pulse" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">AI가 초안을 작성하고 있어요...</p>
                <p className="text-[10px] text-muted-foreground mt-1">채널 톤에 맞춰 작성 중</p>
              </div>
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
          ) : showGeneratePrompt ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <FileEdit className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                이 아이디어의 콘텐츠 초안을<br />AI가 자동으로 작성합니다
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold gradient-primary text-primary-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" />
                초안 생성하기
              </motion.button>
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[300px] text-xs leading-relaxed bg-muted/30 border-border/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
                >
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-3">
              <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {draft}
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions - only when draft exists and not editing/generating */}
        {draft && !isEditing && !isGenerating && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copied ? '복사됨' : '클립보드에 복사'}
            </button>
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <FileEdit className="h-3 w-3" />
              수정
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors ml-auto"
            >
              <RefreshCw className="h-3 w-3" />
              다시 생성
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
