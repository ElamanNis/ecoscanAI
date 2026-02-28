export type SubscriptionTier = "free" | "standard" | "premium";
export type ApiKeyPlan = "free" | "pro" | "enterprise";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          subscription_tier: SubscriptionTier;
          api_usage_count: number;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          api_usage_count?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          api_usage_count?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
        };
      };
      scans_history: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          region: string;
          ndvi: number;
          ndvi_category: string;
          analysis_type: string;
          payload: unknown;
        };
        Insert: {
          user_id: string;
          region: string;
          ndvi: number;
          ndvi_category: string;
          analysis_type: string;
          payload: unknown;
        };
        Update: never;
      };
      api_keys: {
        Row: {
          api_key: string;
          key_id: string;
          plan: ApiKeyPlan;
          request_limit_per_minute: number;
          active: boolean;
          created_at: string | null;
          last_used_at: string | null;
          label: string | null;
        };
        Insert: {
          api_key: string;
          key_id: string;
          plan: ApiKeyPlan;
          request_limit_per_minute: number;
          active?: boolean;
          created_at?: string | null;
          last_used_at?: string | null;
          label?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
      rate_limits: {
        Row: {
          key_id: string;
          count: number;
          reset_at: number; // epoch ms
        };
        Insert: {
          key_id: string;
          count: number;
          reset_at: number;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limits"]["Insert"]>;
      };
    };
    Functions: {
      increment_api_usage: {
        Args: { user_id_arg: string };
        Returns: void;
      };
    };
  };
};
