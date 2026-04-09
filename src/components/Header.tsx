import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Lightbulb, Bell, Heart, MessageCircle, Check, Download, ClipboardList, CheckCircle2, AtSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Notification } from '@/hooks/useNotifications';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { supabase } from '@/integrations/supabase/client';
import { AvatarEditModal } from '@/components/AvatarEditModal';

interface HeaderProps {
  onSettingsClick?: () => void;
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (tipId: string) => void;
}

export function Header({ onSettingsClick, notifications = [], unreadCount = 0, onMarkAsRead, onMarkAllAsRead, onNotificationClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; name: string | null; position: string | null; avatar_url: string | null; avatar_color: string | null; custom_initials: string | null } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from('profiles' as any)
      .select('display_name, name, position, avatar_url, avatar_color, custom_initials')
      .eq('id', user.id)
      .single() as any);
    if (data) {
      console.log('[Header] profile updated:', data.avatar_url, data.avatar_color, data.custom_initials);
      setProfile(data);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const { installable, promptInstall } = usePwaInstall();
  const displayName = profile?.display_name || profile?.name || user?.email?.split('@')[0] || '';
  const initials = profile?.custom_initials || displayName.slice(-2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logged out' });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <header className="sticky top-0 z-[100] glass-dock border-b-0">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-12 px-6">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center neon-glow-orange"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lightbulb className="w-4 h-4 text-white" />
          </motion.div>
          <h1 className="text-lg font-bold">
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              DLab
            </span>
            {' '}
            <span className="bg-gradient-to-r from-primary to-neon-pink bg-clip-text text-transparent">
              Archi Tips
            </span>
          </h1>
        </motion.div>

        <div className="flex items-center gap-1.5">
          {/* User indicator */}
          {profile && (
            <div className="flex items-center gap-2 mr-1.5">
              <button onClick={() => setShowAvatarEdit(true)} className="shrink-0 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-border/50"
                  />
                ) : profile.avatar_color ? (
                  <div
                    className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center ring-1 ring-border/50"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {initials}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center ring-1 ring-border/50">
                    {initials}
                  </div>
                )}
              </button>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">{displayName}</span>
                {profile.position && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{profile.position}</span>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(prev => !prev)}
              className="glass-button w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notification dropdown rendered via portal */}
          </div>
          {createPortal(
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowNotifications(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="fixed top-14 left-1/2 -translate-x-1/2 w-[90vw] sm:w-96 max-h-[80vh] glass-card rounded-xl shadow-xl overflow-y-auto z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                      <span className="text-sm font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => onMarkAllAsRead?.()}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => {
                          const fromName = n.from_profile?.display_name || n.from_profile?.name || n.from_profile?.email?.split('@')[0] || 'Someone';
                          const isTask = n.type === 'task_assignment' || n.type === 'task_acknowledged' || n.type === 'task_completed';
                          const isComment = n.type === 'comment';
                          const isMention = n.type === 'mention';

                          const getNotifText = () => {
                            if (n.type === 'task_assignment') return `님이 업무를 지시했습니다: ${n.message || ''}`;
                            if (n.type === 'task_acknowledged') return '님이 업무를 확인했습니다';
                            if (n.type === 'task_completed') return '님이 업무를 완료했습니다';
                            if (isMention) return `님이 댓글에서 회원님을 언급했습니다`;
                            if (isComment) return ` commented on ${n.tip?.title || 'a tip'}`;
                            return ` liked ${n.tip?.title || 'a tip'}`;
                          };

                          const getIconStyle = () => {
                            if (isTask) return 'bg-orange-500/15 text-orange-500';
                            if (isMention) return 'bg-violet-500/15 text-violet-500';
                            if (isComment) return 'bg-cyan-500/15 text-cyan-500';
                            return 'bg-rose-500/15 text-rose-500';
                          };

                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (!n.read) onMarkAsRead?.(n.id);
                                if (n.tip_id) onNotificationClick?.(n.tip_id);
                                setShowNotifications(false);
                              }}
                              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors border-b border-border/10 ${
                                !n.read ? 'bg-primary/5' : ''
                              }`}
                            >
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getIconStyle()}`}>
                                {isTask ? <ClipboardList className="h-3.5 w-3.5" /> : isMention ? <AtSign className="h-3.5 w-3.5" /> : isComment ? <MessageCircle className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed">
                                  <span className="font-semibold">{fromName}</span>
                                  <span className="line-clamp-2">{getNotifText()}</span>
                                </p>
                                <span className="text-[10px] text-muted-foreground">{formatTime(n.created_at)}</span>
                              </div>

                              {/* Unread dot */}
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* PWA Install */}
          {installable && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => promptInstall()}
              className="glass-button w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
              title="앱 설치하기"
            >
              <Download className="h-4 w-4" />
            </motion.button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {onSettingsClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsClick}
              className="glass-button w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="glass-button w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
      {user && profile && (
        <AvatarEditModal
          isOpen={showAvatarEdit}
          onClose={() => setShowAvatarEdit(false)}
          userId={user.id}
          displayName={displayName}
          currentAvatarUrl={profile.avatar_url}
          currentColor={profile.avatar_color}
          currentInitials={profile.custom_initials}
          onSaved={fetchProfile}
        />
      )}
    </header>
  );
}
