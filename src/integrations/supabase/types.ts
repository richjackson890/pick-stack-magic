export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          keywords: string | null
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          keywords?: string | null
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          keywords?: string | null
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      content_ideas: {
        Row: {
          channel_id: string | null
          content_layers: Json | null
          created_at: string | null
          draft_content: string | null
          estimated_engagement: string | null
          format: string | null
          hashtags: string[] | null
          hook: string | null
          id: string
          reference_item_ids: string[] | null
          scheduled_date: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          content_layers?: Json | null
          created_at?: string | null
          draft_content?: string | null
          estimated_engagement?: string | null
          format?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          reference_item_ids?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          content_layers?: Json | null
          created_at?: string | null
          draft_content?: string | null
          estimated_engagement?: string | null
          format?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          reference_item_ids?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "creator_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_channels: {
        Row: {
          color: string | null
          content_formula: string | null
          created_at: string | null
          id: string
          name: string
          platform: string
          posting_schedule: number[] | null
          target_hashtags: string[] | null
          tone_keywords: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          content_formula?: string | null
          created_at?: string | null
          id?: string
          name: string
          platform: string
          posting_schedule?: number[] | null
          target_hashtags?: string[] | null
          tone_keywords?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          content_formula?: string | null
          created_at?: string | null
          id?: string
          name?: string
          platform?: string
          posting_schedule?: number[] | null
          target_hashtags?: string[] | null
          tone_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          ai_attempts: number
          ai_confidence: number | null
          ai_error: string | null
          ai_finished_at: string | null
          ai_reason: string | null
          ai_started_at: string | null
          ai_status: string
          analysis_mode: string
          category_id: string | null
          core_keywords: string[] | null
          created_at: string
          entities: string[] | null
          extracted_text: string | null
          fallback_title: string | null
          hashtags: string[] | null
          id: string
          intent: string | null
          platform: string
          search_blob: string | null
          smart_snippet: string | null
          source_type: string
          summary_3lines: string[] | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string | null
          url_hash: string | null
          user_id: string
          user_note: string | null
        }
        Insert: {
          ai_attempts?: number
          ai_confidence?: number | null
          ai_error?: string | null
          ai_finished_at?: string | null
          ai_reason?: string | null
          ai_started_at?: string | null
          ai_status?: string
          analysis_mode?: string
          category_id?: string | null
          core_keywords?: string[] | null
          created_at?: string
          entities?: string[] | null
          extracted_text?: string | null
          fallback_title?: string | null
          hashtags?: string[] | null
          id?: string
          intent?: string | null
          platform?: string
          search_blob?: string | null
          smart_snippet?: string | null
          source_type?: string
          summary_3lines?: string[] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url?: string | null
          url_hash?: string | null
          user_id: string
          user_note?: string | null
        }
        Update: {
          ai_attempts?: number
          ai_confidence?: number | null
          ai_error?: string | null
          ai_finished_at?: string | null
          ai_reason?: string | null
          ai_started_at?: string | null
          ai_status?: string
          analysis_mode?: string
          category_id?: string | null
          core_keywords?: string[] | null
          created_at?: string
          entities?: string[] | null
          extracted_text?: string | null
          fallback_title?: string | null
          hashtags?: string[] | null
          id?: string
          intent?: string | null
          platform?: string
          search_blob?: string | null
          smart_snippet?: string | null
          source_type?: string
          summary_3lines?: string[] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          url_hash?: string | null
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_analysis_count: number
          auto_analyze: boolean
          avatar_url: string | null
          created_at: string
          display_name: string | null
          draft_generation_count: number
          email: string | null
          feed_generation_date: string | null
          id: string
          idea_generation_count: number
          is_premium: boolean
          items_count: number
          monthly_reset_at: string
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis_count?: number
          auto_analyze?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          draft_generation_count?: number
          email?: string | null
          feed_generation_date?: string | null
          id?: string
          idea_generation_count?: number
          is_premium?: boolean
          items_count?: number
          monthly_reset_at?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis_count?: number
          auto_analyze?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          draft_generation_count?: number
          email?: string | null
          feed_generation_date?: string | null
          id?: string
          idea_generation_count?: number
          is_premium?: boolean
          items_count?: number
          monthly_reset_at?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_collections: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          item_ids: string[]
          share_code: string
          title: string
          user_id: string
          view_count: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          item_ids?: string[]
          share_code: string
          title: string
          user_id: string
          view_count?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          item_ids?: string[]
          share_code?: string
          title?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_items: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_id: string
          share_code: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id: string
          share_code: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_id?: string
          share_code?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_shared_collections: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          item_ids: string[] | null
          share_code: string | null
          title: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          item_ids?: string[] | null
          share_code?: string | null
          title?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          item_ids?: string[] | null
          share_code?: string | null
          title?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      public_shared_items: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          item_id: string | null
          share_code: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          item_id?: string | null
          share_code?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          item_id?: string | null
          share_code?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_shared_collection_public: {
        Args: { p_share_code: string }
        Returns: Json
      }
      get_shared_item_public: { Args: { p_share_code: string }; Returns: Json }
      increment_shared_view_count: {
        Args: { p_share_code: string; p_table_name: string }
        Returns: number
      }
      reset_monthly_usage: { Args: never; Returns: undefined }
      search_items: {
        Args: {
          p_categories?: string[]
          p_limit?: number
          p_platforms?: string[]
          p_query: string
          p_user_id: string
        }
        Returns: {
          ai_status: string
          category_id: string
          core_keywords: string[]
          created_at: string
          entities: string[]
          fallback_title: string
          hashtags: string[]
          id: string
          platform: string
          rank: number
          smart_snippet: string
          tags: string[]
          thumbnail_url: string
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
