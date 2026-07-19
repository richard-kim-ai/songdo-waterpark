import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_PAGES } from './pages';

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // select('*') 사용: is_super_admin/permissions 컬럼을 아직 추가하는 마이그레이션을
  // 실행하기 전이라도(0013_admin_permissions.sql) 쿼리 자체가 에러 없이 동작하도록 함.
  // 특정 컬럼을 지정해서 select하면 컬럼이 없을 때 전체 쿼리가 실패해 모든 관리자가
  // 로그인 화면으로 튕겨나가는 전면 장애가 발생할 수 있음.
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect('/admin/login');
  }

  return {
    supabase,
    user,
    // 마이그레이션 실행 전에는 컬럼이 없어 undefined이므로, 기존 동작(전체 권한)을
    // 유지하도록 기본값을 true로 둠.
    isSuperAdmin: adminRow.is_super_admin ?? true,
    permissions: adminRow.permissions ?? [],
  };
}

// 제한된 관리자가 권한 없는 페이지에 직접 URL로 접근하는 것을 막습니다.
// 슈퍼 관리자는 항상 통과, 제한된 관리자는 permissions 배열에 pageKey가 있어야 통과.
export async function requirePagePermission(pageKey: string) {
  const result = await requireAdmin();
  if (result.isSuperAdmin || result.permissions.includes(pageKey)) {
    return result;
  }

  // 권한이 없으면 본인이 접근 가능한 첫 페이지로 보냄 (무한 리다이렉트 방지)
  const fallback = ADMIN_PAGES.find((p) => result.permissions.includes(p.key));
  redirect(fallback ? fallback.href : '/admin/login');
}

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (!result.isSuperAdmin) {
    redirect('/admin');
  }
  return result;
}
