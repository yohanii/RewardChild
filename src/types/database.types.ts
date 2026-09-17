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
      attendance_claims: {
        Row: {
          amount_granted: number
          claimed_at: string
          claimed_on: string
          user_id: number
        }
        Insert: {
          amount_granted?: number
          claimed_at?: string
          claimed_on: string
          user_id: number
        }
        Update: {
          amount_granted?: number
          claimed_at?: string
          claimed_on?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
          cash_amount: number
          content: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_play_product_id: string | null
          id: number
          is_active: boolean
          parent_id: number | null
          price_krw: number
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          cash_amount?: number
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          google_play_product_id?: string | null
          id?: number
          is_active?: boolean
          parent_id?: number | null
          price_krw: number
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          cash_amount?: number
          content?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          google_play_product_id?: string | null
          id?: number
          is_active?: boolean
          parent_id?: number | null
          price_krw?: number
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_purchases: {
        Row: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        Insert: {
          bank_item_id: number
          cancelled_at?: string | null
          cash_granted?: number
          consume_attempt_count?: number
          consume_last_attempt_at?: string | null
          consume_last_error_code?: string | null
          consume_lease_expires_at?: string | null
          consume_lease_id?: string | null
          consume_retry_exhausted_at?: string | null
          consume_status?: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          google_order_id?: string | null
          google_play_product_id_snapshot?: string | null
          id?: number
          paid_at?: string | null
          parent_id: number
          price_krw_snapshot: number
          provider?: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["bank_purchase_status"]
        }
        Update: {
          bank_item_id?: number
          cancelled_at?: string | null
          cash_granted?: number
          consume_attempt_count?: number
          consume_last_attempt_at?: string | null
          consume_last_error_code?: string | null
          consume_lease_expires_at?: string | null
          consume_lease_id?: string | null
          consume_retry_exhausted_at?: string | null
          consume_status?: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_unit"]
          google_order_id?: string | null
          google_play_product_id_snapshot?: string | null
          id?: number
          paid_at?: string | null
          parent_id?: number
          price_krw_snapshot?: number
          provider?: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["bank_purchase_status"]
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
          fulfilled_at: string | null
          id: number
          idempotency_key: string | null
          price_paid: number
          quantity: number
          shop_item_id: number
          status: Database["public"]["Enums"]["shop_purchase_status"]
        }
        Insert: {
          child_id: number
          created_at?: string | null
          fulfilled_at?: string | null
          id?: number
          idempotency_key?: string | null
          price_paid: number
          quantity?: number
          shop_item_id: number
          status?: Database["public"]["Enums"]["shop_purchase_status"]
        }
        Update: {
          child_id?: number
          created_at?: string | null
          fulfilled_at?: string | null
          id?: number
          idempotency_key?: string | null
          price_paid?: number
          quantity?: number
          shop_item_id?: number
          status?: Database["public"]["Enums"]["shop_purchase_status"]
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
      claim_daily_attendance: { Args: never; Returns: number }
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
      approve_relation_request: {
        Args: { p_relation_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      block_relation: {
        Args: { p_relation_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_relation_request: {
        Args: { p_relation_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_google_play_consume_retries: {
        Args: { p_limit?: number; p_now?: string }
        Returns: {
          attempt_count: number
          lease_id: string
          product_id: string
          purchase_id: number
          purchase_token: string
        }[]
      }
      complete_google_play_consume_retry: {
        Args: {
          p_error_code?: string
          p_lease_id: string
          p_purchase_token: string
          p_succeeded: boolean
        }
        Returns: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bank_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_google_play_purchase_pending: {
        Args: {
          p_google_play_product_id: string
          p_parent_auth_user_id: string
          p_purchase_token: string
        }
        Returns: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bank_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_mock_bank_purchase: {
        Args: {
          p_idempotency_key: string
          p_parent_auth_user_id: string
          p_product_id: string
        }
        Returns: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bank_purchases"
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
      create_relation_request: {
        Args: { p_child_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_shop_item: {
        Args: { p_content: string; p_price: number; p_title: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "shop_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deactivate_shop_item: {
        Args: { p_shop_item_id: number }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "shop_items"
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
      finalize_google_play_purchase: {
        Args: {
          p_google_order_id?: string
          p_purchase_token: string
          p_verified_google_play_product_id: string
        }
        Returns: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bank_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_child_by_tag: {
        Args: { _nickname: string; _tag: string }
        Returns: { id: number }[]
      }
      fulfill_shop_purchase: {
        Args: { p_shop_purchase_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          fulfilled_at: string | null
          id: number
          idempotency_key: string | null
          price_paid: number
          quantity: number
          shop_item_id: number
          status: Database["public"]["Enums"]["shop_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "shop_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_family_profiles: {
        Args: { p_user_ids: number[] }
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
      purchase_shop_item: {
        Args: { p_idempotency_key: string; p_shop_item_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          fulfilled_at: string | null
          id: number
          idempotency_key: string | null
          price_paid: number
          quantity: number
          shop_item_id: number
          status: Database["public"]["Enums"]["shop_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "shop_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_google_play_consume_result: {
        Args: {
          p_error_code?: string
          p_purchase_token: string
          p_succeeded: boolean
        }
        Returns: {
          bank_item_id: number
          cancelled_at: string | null
          cash_granted: number
          consume_attempt_count: number
          consume_last_attempt_at: string | null
          consume_last_error_code: string | null
          consume_lease_expires_at: string | null
          consume_lease_id: string | null
          consume_retry_exhausted_at: string | null
          consume_status: Database["public"]["Enums"]["google_play_consume_status"]
          consumed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_unit"]
          google_order_id: string | null
          google_play_product_id_snapshot: string | null
          id: number
          paid_at: string | null
          parent_id: number
          price_krw_snapshot: number
          provider: Database["public"]["Enums"]["bank_purchase_provider"]
          refunded_at: string | null
          status: Database["public"]["Enums"]["bank_purchase_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bank_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      reject_relation_request: {
        Args: { p_relation_id: number }
        Returns: {
          child_id: number
          created_at: string | null
          id: number
          parent_id: number
          status: Database["public"]["Enums"]["relation_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "relations"
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
      select_user_role: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: {
          auth_user_id: string | null
          created_at: string | null
          id: number
          nickname: string | null
          role: Database["public"]["Enums"]["user_role"]
          tag: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
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
      update_shop_item: {
        Args: {
          p_content: string
          p_price: number
          p_shop_item_id: number
          p_title: string
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "shop_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      balance_type: "ATTENDANCE" | "CASH"
      bank_purchase_provider: "GOOGLE_PLAY" | "MOCK"
      bank_purchase_status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED"
      currency_unit: "COIN" | "KRW"
      google_play_consume_status:
        | "NOT_STARTED"
        | "PENDING"
        | "FAILED"
        | "CONSUMED"
      quest_status: "REGISTERED" | "REQUESTED" | "COMPLETED" | "REJECTED"
      reference_type: "QUEST" | "SHOP_PURCHASE" | "BANK_PURCHASE"
      relation_status: "PENDING" | "ACTIVE" | "BLOCKED"
      shop_purchase_status: "PURCHASED" | "FULFILLED"
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
      bank_purchase_provider: ["GOOGLE_PLAY", "MOCK"],
      bank_purchase_status: ["PENDING", "PAID", "CANCELLED", "REFUNDED"],
      currency_unit: ["COIN", "KRW"],
      google_play_consume_status: [
        "NOT_STARTED",
        "PENDING",
        "FAILED",
        "CONSUMED",
      ],
      quest_status: ["REGISTERED", "REQUESTED", "COMPLETED", "REJECTED"],
      reference_type: ["QUEST", "SHOP_PURCHASE", "BANK_PURCHASE"],
      relation_status: ["PENDING", "ACTIVE", "BLOCKED"],
      shop_purchase_status: ["PURCHASED", "FULFILLED"],
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
