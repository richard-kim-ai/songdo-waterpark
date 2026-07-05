import { requireAdmin } from '@/lib/admin/auth';
import AdminSidebar from './AdminSidebar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-10 overflow-y-auto">{children}</div>
    </div>
  );
}
