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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          amount_cents: number
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      gateway_settings: {
        Row: {
          api_key_encrypted: string | null
          id: number
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          id?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          id?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      pix_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          external_id: string
          fee_cents: number | null
          id: string
          net_amount_cents: number | null
          paid_at: string | null
          pix_copy_paste: string | null
          provider_id: string | null
          raw_response: Json | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          external_id: string
          fee_cents?: number | null
          id?: string
          net_amount_cents?: number | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          provider_id?: string | null
          raw_response?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          external_id?: string
          fee_cents?: number | null
          id?: string
          net_amount_cents?: number | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          provider_id?: string | null
          raw_response?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          price_cents: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          price_cents?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          price_cents?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated: boolean
          balance_cents: number
          blocked: boolean
          created_at: string
          document: string | null
          first_withdrawal_done: boolean
          id: string
          last_checkin_date: string | null
          last_deposit_notified_id: string | null
          name: string | null
          phone: string
          promo_code: string | null
          referred_by: string | null
          total_deposited_cents: number
          total_earned_cents: number
          vip_at_last_withdrawal: number
          vip_level: number
          withdraw_password_hash: string | null
        }
        Insert: {
          activated?: boolean
          balance_cents?: number
          blocked?: boolean
          created_at?: string
          document?: string | null
          first_withdrawal_done?: boolean
          id: string
          last_checkin_date?: string | null
          last_deposit_notified_id?: string | null
          name?: string | null
          phone: string
          promo_code?: string | null
          referred_by?: string | null
          total_deposited_cents?: number
          total_earned_cents?: number
          vip_at_last_withdrawal?: number
          vip_level?: number
          withdraw_password_hash?: string | null
        }
        Update: {
          activated?: boolean
          balance_cents?: number
          blocked?: boolean
          created_at?: string
          document?: string | null
          first_withdrawal_done?: boolean
          id?: string
          last_checkin_date?: string | null
          last_deposit_notified_id?: string | null
          name?: string | null
          phone?: string
          promo_code?: string | null
          referred_by?: string | null
          total_deposited_cents?: number
          total_earned_cents?: number
          vip_at_last_withdrawal?: number
          vip_level?: number
          withdraw_password_hash?: string | null
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          key: string
          updated_at: string
          url: string
        }
        Insert: {
          key: string
          updated_at?: string
          url: string
        }
        Update: {
          key?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          reward_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          reward_cents?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          reward_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_tiers: {
        Row: {
          checkin_bonus_cents: number
          daily_tasks: number
          level: number
          min_deposited_cents: number
          name: string
        }
        Insert: {
          checkin_bonus_cents?: number
          daily_tasks: number
          level: number
          min_deposited_cents: number
          name: string
        }
        Update: {
          checkin_bonus_cents?: number
          daily_tasks?: number
          level?: number
          min_deposited_cents?: number
          name?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          external_id: string | null
          id: string
          payload: Json
          received_at: string
          transaction_id: string | null
        }
        Insert: {
          external_id?: string | null
          id?: string
          payload: Json
          received_at?: string
          transaction_id?: string | null
        }
        Update: {
          external_id?: string | null
          id?: string
          payload?: Json
          received_at?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pix_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount_cents: number
          created_at: string
          fee_cents: number
          holder_document: string
          holder_name: string
          id: string
          net_cents: number
          pix_key: string
          pix_key_type: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          fee_cents?: number
          holder_document: string
          holder_name: string
          id?: string
          net_cents: number
          pix_key: string
          pix_key_type: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          fee_cents?: number
          holder_document?: string
          holder_name?: string
          id?: string
          net_cents?: number
          pix_key?: string
          pix_key_type?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_deposit: { Args: { _tx_id: string }; Returns: undefined }
      admin_credit_deposit: { Args: { _tx_id: string }; Returns: undefined }
      admin_finalize_withdrawal: {
        Args: { _approve: boolean; _wd_id: string }
        Returns: undefined
      }
      complete_task: {
        Args: { _product_id: string; _reward_cents: number; _user_id: string }
        Returns: undefined
      }
      credit_balance: {
        Args: { _amount_cents: number; _user_id: string }
        Returns: undefined
      }
      do_checkin: {
        Args: { _user_id: string }
        Returns: {
          amount_cents: number
        }[]
      }
      maybe_activate: { Args: { _user_id: string }; Returns: undefined }
      recalc_vip: { Args: { _user_id: string }; Returns: undefined }
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
