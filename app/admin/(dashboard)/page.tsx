import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { ADMIN_PAGES } from '@/lib/admin/pages';

export default async function AdminHomePage() {
  const { isSuperAdmin, permissions } = await requireAdmin();
  const target = isSuperAdmin
    ? ADMIN_PAGES[0]
    : ADMIN_PAGES.find((p) => permissions.includes(p.key));

  redirect(target ? target.href : '/admin/login');
}
