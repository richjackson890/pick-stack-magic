import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Platform } from '@/types/pickstack';
import { getSafeErrorMessage } from '@/lib/errorUtils';

export type AiStatus = 'pending' | 'processing' | 'done' | 'error';
export type AnalysisMode = 'light' | 'deep' | 'none';

export interface DbItem {
  id: string;
  user_id: string;
  category_id: string | null;
  source_type: 'url' | 'text' | 'image';
  url: string | null;
  title: string;
  platform: Platform;
  thumbnail_url: string | null;
  summary_3lines: string[];
  tags: string[];
  user_note: string | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  ai_status: AiStatus;
  ai_error: string | null;
  ai_started_at: string | null;
  ai_finished_at: string | null;
  ai_attempts: number;
  extracted_text: string | null;
  url_hash: string | null;
  analysis_mode: AnalysisMode;
  created_at: string;
  updated_at: string;
}

export function useDbItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match DbItem type (cast to any to handle dynamic columns)
      const transformedData: DbItem[] = (data || []).map((item: any) => ({
        ...item,
        source_type: item.source_type as 'url' | 'text' | 'image',
        platform: item.platform as Platform,
        summary_3lines: item.summary_3lines || [],
        tags: item.tags || [],
        ai_status: (item.ai_status || 'pending') as AiStatus,
        ai_error: item.ai_error || null,
        ai_started_at: item.ai_started_at || null,
        ai_finished_at: item.ai_finished_at || null,
        ai_attempts: item.ai_attempts || 0,
        extracted_text: item.extracted_text || null,
        url_hash: item.url_hash || null,
        analysis_mode: (item.analysis_mode || 'light') as AnalysisMode,
      }));
      
      setItems(transformedData);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: '아이템 로드 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<DbItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          category_id: item.category_id,
          source_type: item.source_type,
          url: item.url,
          title: item.title,
          platform: item.platform,
          thumbnail_url: item.thumbnail_url,
          summary_3lines: item.summary_3lines,
          tags: item.tags,
          user_note: item.user_note,
          ai_confidence: item.ai_confidence,
          ai_reason: item.ai_reason,
          ai_status: item.ai_status,
          ai_error: item.ai_error,
          ai_started_at: item.ai_started_at,
          ai_finished_at: item.ai_finished_at,
          ai_attempts: item.ai_attempts,
          extracted_text: item.extracted_text,
          url_hash: item.url_hash,
          analysis_mode: item.analysis_mode,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newItem: DbItem = {
        ...(data as any),
        source_type: data.source_type as 'url' | 'text' | 'image',
        platform: data.platform as Platform,
        summary_3lines: data.summary_3lines || [],
        tags: data.tags || [],
        ai_status: (data.ai_status || 'pending') as AiStatus,
        ai_error: (data as any).ai_error || null,
        ai_started_at: (data as any).ai_started_at || null,
        ai_finished_at: (data as any).ai_finished_at || null,
        ai_attempts: (data as any).ai_attempts || 0,
        extracted_text: (data as any).extracted_text || null,
        url_hash: (data as any).url_hash || null,
        analysis_mode: ((data as any).analysis_mode || 'light') as AnalysisMode,
      };
      
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: '저장 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<DbItem>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      return true;
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: '수정 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: '삭제 실패',
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}
