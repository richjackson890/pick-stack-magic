import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tip } from '@/hooks/useTips';
import { useTipComments, TipComment } from '@/hooks/useTipComments';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Trash2, User, Loader2, MessageCircle } from 'lucide-react';

interface TipDetailModalProps {
  tip: Tip | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TipDetailModal({ tip, isOpen, onClose }: TipDetailModalProps) {
  const { user } = useAuth();
  const { comments, loading, fetchComments, addComment, deleteComment } = useTipComments();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tip) {
      fetchComments(tip.id);
      setNewComment('');
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
    await addComment(tip.id, newComment);
    setNewComment('');
    setSending(false);
  };

  if (!tip) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[75vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2 text-left">
            <MessageCircle className="h-5 w-5 text-primary shrink-0" />
            <span className="line-clamp-1">{tip.title}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
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

        {/* Comment input */}
        <div className="shrink-0 flex gap-2 pt-3 border-t border-border/30">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2.5"
    >
      {comment.profiles?.avatar_url ? (
        <img src={comment.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold">{name}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          {isOwn && (
            <button onClick={onDelete} className="text-muted-foreground hover:text-destructive ml-auto">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
      </div>
    </motion.div>
  );
}
