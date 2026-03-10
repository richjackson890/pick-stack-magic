import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CreatorChannel {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  tone_keywords: string[];
  content_formula: string | null;
  posting_schedule: number[];
  target_hashtags: string[];
  color: string;
  created_at: string;
  updated_at: string;
}

export type CreatorChannelInsert = Omit<CreatorChannel, 'id' | 'created_at' | 'updated_at'>;
export type CreatorChannelUpdate = Partial<Omit<CreatorChannel, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

const FREE_MAX_CHANNELS = 1;
const PRO_MAX_CHANNELS = 5;

export function useCreatorChannels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('creator_channels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch channels:', error);
    } else {
      setChannels((data || []).map(ch => ({
        ...ch,
        tone_keywords: ch.tone_keywords || [],
        posting_schedule: ch.posting_schedule || [],
        target_hashtags: ch.target_hashtags || [],
        color: ch.color || '#4A90D9',
      })) as CreatorChannel[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const canAddChannel = (isPremium: boolean) => {
    const max = isPremium ? PRO_MAX_CHANNELS : FREE_MAX_CHANNELS;
    return channels.length < max;
  };

  const getMaxChannels = (isPremium: boolean) => isPremium ? PRO_MAX_CHANNELS : FREE_MAX_CHANNELS;

  const addChannel = async (channel: Omit<CreatorChannelInsert, 'user_id'>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('creator_channels')
      .insert({ ...channel, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: '채널 등록 실패', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchChannels();
    toast({ title: '채널이 등록되었습니다' });
    return data;
  };

  const updateChannel = async (id: string, updates: CreatorChannelUpdate) => {
    const { error } = await supabase
      .from('creator_channels')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: '채널 수정 실패', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchChannels();
    toast({ title: '채널이 수정되었습니다' });
    return true;
  };

  const deleteChannel = async (id: string) => {
    const { error } = await supabase
      .from('creator_channels')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: '채널 삭제 실패', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchChannels();
    toast({ title: '채널이 삭제되었습니다' });
    return true;
  };

  return {
    channels,
    loading,
    addChannel,
    updateChannel,
    deleteChannel,
    canAddChannel,
    getMaxChannels,
    refetch: fetchChannels,
  };
}
