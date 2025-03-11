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
      daily_stats: {
        Row: {
          date: string
          defense_count: number | null
          defense_total: number | null
          id: string
          net_change: number | null
          offense_count: number | null
          offense_total: number | null
          player_id: string
        }
        Insert: {
          date: string
          defense_count?: number | null
          defense_total?: number | null
          id?: string
          net_change?: number | null
          offense_count?: number | null
          offense_total?: number | null
          player_id: string
        }
        Update: {
          date?: string
          defense_count?: number | null
          defense_total?: number | null
          id?: string
          net_change?: number | null
          offense_count?: number | null
          offense_total?: number | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "tracked_players"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_players: {
        Row: {
          clan_name: string | null
          created_at: string | null
          current_trophies: number | null
          id: string
          is_tracking: boolean | null
          last_updated: string | null
          name: string | null
          player_tag: string
        }
        Insert: {
          clan_name?: string | null
          created_at?: string | null
          current_trophies?: number | null
          id?: string
          is_tracking?: boolean | null
          last_updated?: string | null
          name?: string | null
          player_tag: string
        }
        Update: {
          clan_name?: string | null
          created_at?: string | null
          current_trophies?: number | null
          id?: string
          is_tracking?: boolean | null
          last_updated?: string | null
          name?: string | null
          player_tag?: string
        }
        Relationships: []
      }
      trophy_history: {
        Row: {
          id: string
          is_attack: boolean
          new_trophies: number
          player_id: string
          previous_trophies: number
          recorded_at: string | null
          trophy_change: number
        }
        Insert: {
          id?: string
          is_attack: boolean
          new_trophies: number
          player_id: string
          previous_trophies: number
          recorded_at?: string | null
          trophy_change: number
        }
        Update: {
          id?: string
          is_attack?: boolean
          new_trophies?: number
          player_id?: string
          previous_trophies?: number
          recorded_at?: string | null
          trophy_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "trophy_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "tracked_players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
