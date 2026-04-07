import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#84cc16', '#eab308', '#78716c', '#334155',
];

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  currentAvatarUrl: string | null;
  currentColor: string | null;
  onSaved: () => void;
}

export function AvatarEditModal({
  isOpen,
  onClose,
  userId,
  displayName,
  currentAvatarUrl,
  currentColor,
  onSaved,
}: AvatarEditModalProps) {
  const [mode, setMode] = useState<'photo' | 'initials'>(currentAvatarUrl ? 'photo' : 'initials');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [selectedColor, setSelectedColor] = useState(currentColor || '#f97316');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = displayName.slice(-2).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${timestamp}.${ext}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setPreviewUrl(urlData.publicUrl);
      setMode('photo');
    } catch (err: any) {
      console.error('[AvatarEdit] upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      if (mode === 'photo' && previewUrl) {
        updates.avatar_url = previewUrl;
        updates.avatar_color = null;
      } else {
        updates.avatar_url = null;
        updates.avatar_color = selectedColor;
      }

      await (supabase.from('profiles' as any)
        .update(updates)
        .eq('id', userId) as any);

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('[AvatarEdit] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="glass-card rounded-2xl p-5 w-full max-w-xs space-y-4 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">프로필 사진 변경</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              {mode === 'photo' && previewUrl ? (
                <img src={previewUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-border/50" />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold ring-2 ring-border/50"
                  style={{ backgroundColor: selectedColor }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('photo')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                  mode === 'photo' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/50'
                )}
              >
                사진 업로드
              </button>
              <button
                onClick={() => setMode('initials')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                  mode === 'initials' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/50'
                )}
              >
                이니셜
              </button>
            </div>

            {/* Photo upload */}
            {mode === 'photo' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? '업로드 중...' : '이미지 선택'}
                </button>
              </div>
            )}

            {/* Color picker for initials */}
            {mode === 'initials' && (
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-2 block">배경 색상</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        selectedColor === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
