import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export interface UserSettings {
  auto_analyze: boolean;
}

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({ auto_analyze: true });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings({ auto_analyze: true });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('auto_analyze')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setSettings({
        auto_analyze: data?.auto_analyze ?? true,
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateAutoAnalyze = async (enabled: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ auto_analyze: enabled })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, auto_analyze: enabled }));
      toast({
        title: enabled ? '자동 분석 켜짐' : '자동 분석 꺼짐',
        description: enabled 
          ? '저장 시 자동으로 AI 분석이 실행됩니다.' 
          : '저장만 하고 분석은 수동으로 실행하세요.',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating auto_analyze:', error);
      toast({
        title: '설정 변경 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    settings,
    loading,
    updateAutoAnalyze,
    refetch: fetchSettings,
  };
}
