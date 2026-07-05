import { requireAdmin } from '@/lib/admin/auth';
import { resolveSiteImages } from '@/lib/images';
import AdminSidebar from './AdminSidebar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase } = await requireAdmin();

  const { data: settingsRows } = await supabase.from('site_settings').select('key,value');
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const siteImages = resolveSiteImages(settings);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar logoUrl={siteImages.logo} />
      <div className="flex-1 p-10 overflow-y-auto">{children}</div>
    </div>
  );
}
