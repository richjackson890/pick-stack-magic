import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from '@/types/pickstack';

export interface SearchResult {
  id: string;
  title: string;
  fallback_title: string | null;
  smart_snippet: string | null;
  thumbnail_url: string | null;
  platform: Platform;
  category_id: string | null;
  core_keywords: string[];
  hashtags: string[];
  entities: string[];
  tags: string[];
  created_at: string;
  ai_status: string;
  rank: number;
}

interface UseSearchOptions {
  limit?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const { limit = 50 } = options;

  const search = useCallback(async (
    query: string,
    categoryIds?: string[],
    platforms?: string[]
  ): Promise<SearchResult[]> => {
    if (!user) {
      setResults([]);
      return [];
    }

    // Skip empty queries but allow filter-only searches
    if (!query && !categoryIds?.length && !platforms?.length) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    setLastQuery(query);

    try {
      // Use the database function for full-text search
      const { data, error } = await supabase.rpc('search_items', {
        p_user_id: user.id,
        p_query: query || '',
        p_categories: categoryIds || null,
        p_platforms: platforms || null,
        p_limit: limit,
      });

      if (error) {
        console.error('[useSearch] Search error:', error);
        throw error;
      }

      const searchResults: SearchResult[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        fallback_title: item.fallback_title,
        smart_snippet: item.smart_snippet,
        thumbnail_url: item.thumbnail_url,
        platform: item.platform as Platform,
        category_id: item.category_id,
        core_keywords: item.core_keywords || [],
        hashtags: item.hashtags || [],
        entities: item.entities || [],
        tags: item.tags || [],
        created_at: item.created_at,
        ai_status: item.ai_status,
        rank: item.rank || 0,
      }));

      setResults(searchResults);
      return searchResults;
    } catch (error) {
      console.error('[useSearch] Error:', error);
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [user, limit]);

  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery('');
  }, []);

  return {
    results,
    isSearching,
    lastQuery,
    search,
    clearResults,
  };
}
