import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Generate a short unique share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface SharedItem {
  id: string;
  item_id: string;
  user_id: string;
  share_code: string;
  created_at: string;
  expires_at: string | null;
  view_count: number;
}

export interface SharedCollection {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  share_code: string;
  item_ids: string[];
  created_at: string;
  expires_at: string | null;
  view_count: number;
}

export function useSharing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Get the base URL for sharing
  const getShareBaseUrl = useCallback(() => {
    return `${window.location.origin}/p`;
  }, []);

  // Share a single item
  const shareItem = useCallback(async (itemId: string): Promise<string | null> => {
    if (!user) {
      toast({ title: '로그인 필요', description: '공유하려면 로그인해주세요.', variant: 'destructive' });
      return null;
    }

    setIsSharing(true);
    try {
      // Check if already shared
      const { data: existing } = await supabase
        .from('shared_items')
        .select('share_code')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const url = `${getShareBaseUrl()}/${existing.share_code}`;
        return url;
      }

      // Create new share
      const shareCode = generateShareCode();
      const { error } = await supabase
        .from('shared_items')
        .insert({
          item_id: itemId,
          user_id: user.id,
          share_code: shareCode,
        });

      if (error) throw error;

      const url = `${getShareBaseUrl()}/${shareCode}`;
      return url;
    } catch (error: any) {
      toast({ title: '공유 실패', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [user, toast, getShareBaseUrl]);

  // Share a collection (category or custom selection)
  const shareCollection = useCallback(async (
    title: string,
    itemIds: string[],
    categoryId?: string,
    description?: string
  ): Promise<string | null> => {
    if (!user) {
      toast({ title: '로그인 필요', description: '공유하려면 로그인해주세요.', variant: 'destructive' });
      return null;
    }

    if (itemIds.length === 0) {
      toast({ title: '공유할 항목 없음', description: '최소 1개 이상의 항목을 선택해주세요.', variant: 'destructive' });
      return null;
    }

    setIsSharing(true);
    try {
      const shareCode = generateShareCode();
      const { error } = await supabase
        .from('shared_collections')
        .insert({
          user_id: user.id,
          category_id: categoryId || null,
          title,
          description: description || null,
          share_code: shareCode,
          item_ids: itemIds,
        });

      if (error) throw error;

      const url = `${getShareBaseUrl()}/c/${shareCode}`;
      return url;
    } catch (error: any) {
      toast({ title: '공유 실패', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [user, toast, getShareBaseUrl]);

  // Copy share link to clipboard and optionally use native share
  const copyAndShare = useCallback(async (url: string, title?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      
      // Try native share API on mobile
      if (navigator.share) {
        try {
          await navigator.share({
            title: title || 'PickStack 공유',
            url,
          });
        } catch {
          // User cancelled or share failed, but link is copied
        }
      }
      
      toast({ title: '링크 복사됨', description: '클립보드에 복사되었습니다.' });
      return true;
    } catch {
      toast({ title: '복사 실패', description: '링크를 직접 복사해주세요.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  // Get my shared items
  const getMySharedItems = useCallback(async (): Promise<SharedItem[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('shared_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch shared items:', error);
      return [];
    }

    return data as SharedItem[];
  }, [user]);

  // Get my shared collections
  const getMySharedCollections = useCallback(async (): Promise<SharedCollection[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('shared_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch shared collections:', error);
      return [];
    }

    return data as SharedCollection[];
  }, [user]);

  // Delete a shared item
  const deleteSharedItem = useCallback(async (shareId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('shared_items')
      .delete()
      .eq('id', shareId);

    if (error) {
      toast({ title: '삭제 실패', description: error.message, variant: 'destructive' });
      return false;
    }
    
    toast({ title: '공유 해제됨' });
    return true;
  }, [toast]);

  // Delete a shared collection
  const deleteSharedCollection = useCallback(async (shareId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('shared_collections')
      .delete()
      .eq('id', shareId);

    if (error) {
      toast({ title: '삭제 실패', description: error.message, variant: 'destructive' });
      return false;
    }
    
    toast({ title: '공유 해제됨' });
    return true;
  }, [toast]);

  return {
    isSharing,
    shareItem,
    shareCollection,
    copyAndShare,
    getMySharedItems,
    getMySharedCollections,
    deleteSharedItem,
    deleteSharedCollection,
    getShareBaseUrl,
  };
}
