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
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ticket_types']['Row']>;
        Update: Partial<Database['public']['Tables']['ticket_types']['Row']>;
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
      };
      cabana_reservations: {
        Row: {
          id: string;
          zone_id: string;
          reservation_date: string;
          customer_name: string;
          customer_phone: string;
          sunbed_count: number;
          status: string; // 'pending' | 'confirmed' | 'cancelled'
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cabana_reservations']['Row']>;
        Update: Partial<Database['public']['Tables']['cabana_reservations']['Row']>;
      };
    };
  };
};
