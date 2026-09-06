export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      balances: {
        Row: {
          amount: number
          id: number
          type: Database["public"]["Enums"]["balance_type"]
          updated_at: string
          user_id: number
        }
        Insert: {
          amount?: number
          id?: never
          type: Database["public"]["Enums"]["balance_type"]
          updated_at?: string
          user_id: number
        }
        Update: {
          amount?: number
          id?: never
          type?: Database["public"]["Enums"]["balance_type"]
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_items: {
        Row: {
          content: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"] | null
          id: number
          parent_id: number | null
          price: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"] | null
          id?: number
          parent_id?: number | null
          price: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"] | null
          id?: number
          parent_id?: number | null
          price?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_purchases: {
        Row: {
          amount: number
          bank_item_id: number
          coins_granted: number
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"] | null
          id: number
          parent_id: number
        }
        Insert: {
          amount: number
          bank_item_id: number
          coins_granted?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"] | null
          id?: number
          parent_id: number
        }
        Update: {
          amount?: number
          bank_item_id?: number
          coins_granted?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"] | null
          id?: number
          parent_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_purchases_bank_item_id_fkey"
            columns: ["bank_item_id"]
            isOneToOne: false
            referencedRelation: "bank_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bank_purchases_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          child_id: number
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          parent_id: number
          relation_id: number
          reward?: number
          status?: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          child_id?: number
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          parent_id?: number
          relation_id?: number
          reward?: number
          status?: Database["public"]["Enums"]["quest_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_relation_id_fkey"
            columns: ["relation_id"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["id"]
          },
        ]
      }
      relations: {
        Row: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        Insert: {
          child_id: number
          created_at?: string | null
          id?: number
          parent_id: number
          status?: Database["public"]["Enums"]["relation_status"] | null
        }
        Update: {
          child_id?: number
          created_at?: string | null
          id?: number
          parent_id?: number
          status?: Database["public"]["Enums"]["relation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_relations_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_relations_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          content: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          id: number
          is_active: boolean
          parent_id: number
          price: number
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          id?: number
          is_active?: boolean
          parent_id: number
          price: number
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          id?: number
          is_active?: boolean
          parent_id?: number
          price?: number
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_shop_items_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_purchases: {
        Row: {
          child_id: number
          created_at: string | null
          id: number
          price_paid: number
          quantity: number
          shop_item_id: number
        }
        Insert: {
          child_id: number
          created_at?: string | null
          id?: number
          price_paid: number
          quantity?: number
          shop_item_id: number
        }
        Update: {
          child_id?: number
          created_at?: string | null
          id?: number
          price_paid?: number
          quantity?: number
          shop_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_shop_purchases_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          note: string | null
          reference_id: number | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          note?: string | null
          reference_id?: number | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          note?: string | null
          reference_id?: number | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_map: {
        Row: {
          auth_user_id: string
          user_id: number
        }
        Insert: {
          auth_user_id: string
          user_id: number
        }
        Update: {
          auth_user_id?: string
          user_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: number
          nickname: string | null
          role: Database["public"]["Enums"]["user_role"]
          tag: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: number
          nickname?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tag?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: number
          nickname?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tag?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_quest_with_reward: {
        Args: { p_quest_id: number }
        Returns: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quest_with_reward: {
        Args: {
          p_content?: string
          p_relation_id: number
          p_reward: number
          p_title: string
        }
        Returns: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_quest_with_refund: {
        Args: { p_quest_id: number }
        Returns: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_child_by_tag: {
        Args: { _nickname: string; _tag: string }
        Returns: {
          id: number
          nickname: string
          tag: string
        }[]
      }
      give_attendance: {
        Args: { p_cap?: number; p_user_id: number }
        Returns: number
      }
      is_me_user_id: { Args: { target_user_id: number }; Returns: boolean }
      reject_quest: {
        Args: { p_quest_id: number }
        Returns: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_quest_completion: {
        Args: { p_quest_id: number }
        Returns: {
          child_id: number
          completed_at: string | null
          content: string | null
          created_at: string | null
          id: number
          parent_id: number
          relation_id: number
          reward: number
          status: Database["public"]["Enums"]["quest_status"] | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "quests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      spend_coins: {
        Args: {
          p_amount: number
          p_note?: string
          p_reference_id?: number
          p_reference_type?: Database["public"]["Enums"]["reference_type"]
          p_user_id: number
        }
        Returns: undefined
      }
      uid_to_user_id: { Args: { uid: string }; Returns: number }
    }
    Enums: {
      balance_type: "ATTENDANCE" | "CASH"
      currency_unit: "COIN" | "KRW"
      quest_status: "REGISTERED" | "REQUESTED" | "COMPLETED" | "REJECTED"
      reference_type: "QUEST" | "SHOP_PURCHASE" | "BANK_PURCHASE"
      relation_status: "PENDING" | "ACTIVE" | "BLOCKED"
      transaction_type:
        | "QUEST_REWARD"
        | "SHOP_PURCHASE"
        | "BANK_PURCHASE"
        | "ADJUSTMENT"
        | "INITIAL_CREDIT"
        | "ATTENDANCE_REWARD"
        | "SPEND_ATTENDANCE"
        | "SPEND_CASH"
        | "REFUND_ATTENDANCE"
        | "REFUND_CASH"
      user_role: "DEFAULT" | "PARENT" | "CHILD"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      balance_type: ["ATTENDANCE", "CASH"],
      currency_unit: ["COIN", "KRW"],
      quest_status: ["REGISTERED", "REQUESTED", "COMPLETED", "REJECTED"],
      reference_type: ["QUEST", "SHOP_PURCHASE", "BANK_PURCHASE"],
      relation_status: ["PENDING", "ACTIVE", "BLOCKED"],
      transaction_type: [
        "QUEST_REWARD",
        "SHOP_PURCHASE",
        "BANK_PURCHASE",
        "ADJUSTMENT",
        "INITIAL_CREDIT",
        "ATTENDANCE_REWARD",
        "SPEND_ATTENDANCE",
        "SPEND_CASH",
        "REFUND_ATTENDANCE",
        "REFUND_CASH",
      ],
      user_role: ["DEFAULT", "PARENT", "CHILD"],
    },
  },
} as const

