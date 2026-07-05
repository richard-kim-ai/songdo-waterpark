import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Next.js 15+ 부터 cookies()가 비동기 API로 변경되어 이 함수도 async입니다.
 * Server Component / Server Action / Route Handler에서 `await createClient()`로 사용하세요.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (미들웨어에서 세션 갱신 시 처리됨)
          }
        },
      },
    }
  );
}
