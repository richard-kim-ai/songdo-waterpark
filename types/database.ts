export type Database = {
  public: {
    Tables: {
      ticket_types: {
        Row: {
          id: string;
          category: string; // 'general' | 'family_package' | 'attraction'
          name: string;
          description: string | null;
          price: number;
          purchase_url: string | null;
          usage_hours: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ticket_types']['Row']>;
        Update: Partial<Database['public']['Tables']['ticket_types']['Row']>;
        Relationships: [];
      };
      cabana_zones: {
        Row: {
          id: string;
          name: string; // A타입, B타입, C타입, 썬배드 구역
          capacity: number;
          unit_count: number;
          weekday_price: number;
          weekend_price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cabana_zones']['Row']>;
        Update: Partial<Database['public']['Tables']['cabana_zones']['Row']>;
        Relationships: [];
      };
      ticket_orders: {
        Row: {
          id: string;
          ticket_type_id: string;
          visit_date: string;
          quantity: number;
          customer_name: string;
          customer_phone: string;
          status: string; // 'pending' | 'confirmed' | 'cancelled'
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ticket_orders']['Row']>;
        Update: Partial<Database['public']['Tables']['ticket_orders']['Row']>;
        Relationships: [];
      };
      cabana_reservations: {
        Row: {
          id: string;
          reservation_no: string;
          reservation_date: string;
          cabana_no: number;
          time_type: string; // '주간' | '야간' | '종일'
          name: string;
          phone: string;
          guest_count: number;
          is_camping: boolean;
          has_admission: boolean;
          discount_type: string; // '일반' | '단체' | '장애인/유공자'
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cabana_reservations']['Row']>;
        Update: Partial<Database['public']['Tables']['cabana_reservations']['Row']>;
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          is_super_admin: boolean;
          permissions: string[];
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['admin_users']['Row']>;
        Update: Partial<Database['public']['Tables']['admin_users']['Row']>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Relationships: [];
      };
      popups: {
        Row: {
          id: string;
          title: string;
          image_path: string | null;
          link_url: string | null;
          is_active: boolean;
          show_together: boolean;
          start_date: string | null;
          end_date: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['popups']['Row']>;
        Update: Partial<Database['public']['Tables']['popups']['Row']>;
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          label: string;
          image_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['gallery_images']['Row']>;
        Update: Partial<Database['public']['Tables']['gallery_images']['Row']>;
        Relationships: [];
      };
      kakao_notify_settings: {
        Row: {
          id: number;
          rest_api_key: string | null;
          redirect_uri: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['kakao_notify_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['kakao_notify_settings']['Row']>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          author_id: string;
          password_hash: string;
          title: string;
          content: string;
          image_paths: string[];
          reply: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['inquiries']['Row']>;
        Update: Partial<Database['public']['Tables']['inquiries']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
