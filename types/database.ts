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
          zone_type: string; // '케노피' | '그늘막평상' | '썬배드'
          time_type: string | null; // '주간' | '야간' | '종일' | null(썬배드처럼 단일가격)
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
          is_blocked: boolean;
          price_override: number | null;
          zone_type: string; // '케노피' | '그늘막평상' | '썬배드'
          is_no_show: boolean; // 노쇼(미방문): 판매 집계에서 매출·건수 제외
          is_visited: boolean; // 방문 완료(체크인): 확정 매출로 집계
          is_walk_in: boolean; // 현장배정(워크인): 예약 없이 방문, 이름 대신 일일 순번 부여
          // 자리 지정 예약의 노쇼 방지 예약금
          deposit_status: 'none' | 'pending' | 'paid' | 'refunded' | 'forfeited' | 'waived';
          deposit_amount: number;
          depositor_name: string;
          deposit_paid_at: string | null;
          deposit_tx_ref: string | null;
          /** 예약금으로 이용요금 전액을 미리 받은 건 */
          is_full_payment: boolean;
          /** 방문 후 현장 카드결제로 예약금을 환불한 시각 */
          deposit_refunded_at: string | null;
          // 취소 이력 (하드 삭제 대신 소프트 삭제)
          is_cancelled: boolean;
          cancelled_at: string | null;
          cancelled_by: string;
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
      faq_items: {
        Row: {
          id: string;
          title: string;
          content: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['faq_items']['Row']>;
        Update: Partial<Database['public']['Tables']['faq_items']['Row']>;
        Relationships: [];
      };
      kakao_notify_settings: {
        Row: {
          id: number;
          rest_api_key: string | null;
          client_secret: string | null;
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
      aligo_notify_settings: {
        Row: {
          id: number;
          api_key: string | null;
          user_id: string | null;
          sender: string | null;
          sender_key: string | null;
          tpl_code: string | null;
          message_template: string | null;
          use_sms_fallback: boolean;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['aligo_notify_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['aligo_notify_settings']['Row']>;
        Relationships: [];
      };
      deposit_settings: {
        Row: {
          id: number;
          telegram_bot_token: string;
          telegram_chat_id: string;
          openbanking_access_token: string;
          openbanking_fintech_use_num: string;
          openbanking_client_use_code: string;
          openbanking_enabled: boolean;
          openbanking_client_id: string;
          openbanking_client_secret: string;
          openbanking_redirect_uri: string;
          openbanking_refresh_token: string;
          openbanking_user_seq_no: string;
          openbanking_token_expires_at: string | null;
          openbanking_use_test: boolean;
          openbanking_scope: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['deposit_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['deposit_settings']['Row']>;
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
