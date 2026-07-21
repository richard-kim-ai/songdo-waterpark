import { requireAdmin } from '@/lib/admin/auth';
import { resolveSiteImages } from '@/lib/images';
import AdminSidebar from './AdminSidebar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, isSuperAdmin, permissions } = await requireAdmin();

  const { data: settingsRows } = await supabase.from('site_settings').select('key,value');
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const siteImages = resolveSiteImages(settings);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar
        logoUrl={siteImages.logo}
        isSuperAdmin={isSuperAdmin}
        permissions={permissions}
      />
      <div className="flex-1 min-w-0 overflow-y-auto pt-14 px-4 pb-4 md:p-10">{children}</div>
    </div>
  );
}
