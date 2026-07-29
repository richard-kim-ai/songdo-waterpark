import { requireSuperAdmin } from '@/lib/admin/auth';
import { listAdminUsers } from '@/app/admin/actions';
import UserManager from '../UserManager';

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
  const { user } = await requireSuperAdmin();
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">사용자 관리</h1>
      <p className="text-gray-500 mb-6">
        관리자 계정을 등록하고, 각 계정이 관리할 수 있는 메뉴를 선택합니다. 최고 관리자는 모든
        메뉴에 접근할 수 있고, 새로 등록한 관리자는 선택한 메뉴만 볼 수 있습니다.
      </p>
      <UserManager initialUsers={users} currentUserId={user.id} />
    </div>
  );
}
