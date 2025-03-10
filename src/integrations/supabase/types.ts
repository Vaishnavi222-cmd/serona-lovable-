export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          email: string
          id: string
          message: string
          name: string
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          message: string
          name: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          download_url: string | null
          ebook_id: string | null
          id: string
          order_id: string | null
          payment_id: string | null
          purchase_status: Database["public"]["Enums"]["purchase_status"] | null
          updated_at: string | null
          url_expires_at: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          download_url?: string | null
          ebook_id?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          purchase_status?:
            | Database["public"]["Enums"]["purchase_status"]
            | null
          updated_at?: string | null
          url_expires_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          download_url?: string | null
          ebook_id?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          purchase_status?:
            | Database["public"]["Enums"]["purchase_status"]
            | null
          updated_at?: string | null
          url_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebook_purchases_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          created_at: string | null
          description: string
          file_path: string
          id: string
          price: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          file_path: string
          id?: string
          price: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          file_path?: string
          id?: string
          price?: number
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_session_id: string
          content: string
          created_at: string | null
          id: string
          sender: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_session_id: string
          content: string
          created_at?: string | null
          id?: string
          sender: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_session_id?: string
          content?: string
          created_at?: string | null
          id?: string
          sender?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      user_daily_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          input_tokens_used: number
          last_usage_time: string
          output_tokens_used: number
          responses_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          input_tokens_used?: number
          last_usage_time?: string
          output_tokens_used?: number
          responses_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          input_tokens_used?: number
          last_usage_time?: string
          output_tokens_used?: number
          responses_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          amount_paid: number
          created_at: string
          end_time: string
          id: string
          order_id: string | null
          payment_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          remaining_input_tokens: number
          remaining_output_tokens: number
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          end_time: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          remaining_input_tokens: number
          remaining_output_tokens: number
          start_time?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          end_time?: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          remaining_input_tokens?: number
          remaining_output_tokens?: number
          start_time?: string
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
      handle_plan_update: {
        Args: {
          p_user_id: string
          p_plan_type: Database["public"]["Enums"]["plan_type"]
          p_order_id: string
          p_payment_id: string
          p_amount: number
        }
        Returns: {
          amount_paid: number
          created_at: string
          end_time: string
          id: string
          order_id: string | null
          payment_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          remaining_input_tokens: number
          remaining_output_tokens: number
          start_time: string
          status: string
          user_id: string
        }
      }
      reset_daily_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      plan_type: "hourly" | "daily" | "monthly"
      purchase_status: "pending" | "completed" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
