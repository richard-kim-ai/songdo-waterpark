import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * 서버 사이드(Server Action, Route Handler)에서만 사용합니다.
 * service_role 키는 RLS를 우회하므로 절대 클라이언트 컴포넌트에 노출하지 마세요.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
