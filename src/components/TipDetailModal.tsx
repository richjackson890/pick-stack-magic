import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tip } from '@/hooks/useTips';
import { useTipComments, TipComment } from '@/hooks/useTipComments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Trash2, User, Loader2, MessageCircle, Trophy, Save } from 'lucide-react';

interface TipDetailModalProps {
  tip: Tip | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (tipId: string, tipOwnerId: string) => void;
  onTipUpdated?: () => void;
}

export function TipDetailModal({ tip, isOpen, onClose, onCommentAdded, onTipUpdated }: TipDetailModalProps) {
  const { user } = useAuth();
  const { comments, loading, fetchComments, addComment, deleteComment } = useTipComments();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [competitionMemo, setCompetitionMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === tip?.user_id;

  useEffect(() => {
    if (isOpen && tip) {
      fetchComments(tip.id);
      setNewComment('');
      setCompetitionMemo(tip.competition_name || '');
      setMemoSaved(false);
    }
  }, [isOpen, tip, fetchComments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!tip || !newComment.trim()) return;
    setSending(true);
    const success = await addComment(tip.id, newComment);
    if (success) onCommentAdded?.(tip.id, tip.user_id);
    setNewComment('');
    setSending(false);
  };

  const handleSaveMemo = async () => {
    if (!tip) return;
    setSavingMemo(true);
    await (supabase
      .from('tips' as any)
      .update({ competition_name: competitionMemo.trim() || null })
      .eq('id', tip.id) as any);
    setSavingMemo(false);
    setMemoSaved(true);
    onTipUpdated?.();
    setTimeout(() => setMemoSaved(false), 2000);
  };

  if (!tip) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="shrink-0 px-6 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <MessageCircle className="h-5 w-5 text-primary shrink-0" />
            <span className="line-clamp-1">{tip.title}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Thumbnail image */}
        {tip.image_url && (
          <div className="shrink-0 w-full px-6">
            <img
              src={tip.image_url}
              alt={tip.title}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Competition memo */}
        <div className="shrink-0 px-6 py-3 space-y-2 border-b border-border/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            Competition / Project
          </div>
          {isOwner ? (
            <div className="flex gap-2">
              <Input
                value={competitionMemo}
                onChange={(e) => { setCompetitionMemo(e.target.value); setMemoSaved(false); }}
                placeholder="Enter competition or project name..."
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                variant={memoSaved ? 'outline' : 'default'}
                onClick={handleSaveMemo}
                disabled={savingMemo || memoSaved}
                className="shrink-0"
              >
                {savingMemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : memoSaved ? 'Saved' : <Save className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ) : (
            tip.competition_name ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                🏆 {tip.competition_name}
              </span>
            ) : (
              <p className="text-xs text-muted-foreground/60">No competition linked</p>
            )
          )}
        </div>

        {/* Comments list - scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwn={comment.user_id === user?.id}
                  onDelete={() => deleteComment(comment.id, tip.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Comment input - fixed at bottom */}
        <div className="shrink-0 flex gap-2 px-6 py-4 border-t border-border/30 bg-background">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Write a comment..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newComment.trim() || sending}
            className="shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CommentItem({ comment, isOwn, onDelete }: { comment: TipComment; isOwn: boolean; onDelete: () => void }) {
  const name = comment.profiles?.name || comment.profiles?.email?.split('@')[0] || 'Unknown';

  const Avatar = () => (
    comment.profiles?.avatar_url ? (
      <img src={comment.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
    ) : (
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="h-4 w-4" />
      </div>
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-2.5 max-w-[85%] group ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}
    >
      <Avatar />
      <div className={`min-w-0 ${isOwn ? 'items-end' : ''}`}>
        <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold">{name}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className={`relative rounded-2xl px-3.5 py-2 ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed">{comment.content}</p>
          {isOwn && (
            <button
              onClick={onDelete}
              className="absolute -left-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
