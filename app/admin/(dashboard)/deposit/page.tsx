import { requirePagePermission } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPendingDeposits } from '@/app/admin/deposit-actions';
import { getDepositSettings } from '@/lib/telegram';
import DepositManager from '../DepositManager';

export const dynamic = 'force-dynamic';

export default async function DepositAdminPage() {
  await requirePagePermission('deposit');

  const admin = createAdminClient();
  const { data: settingRows } = await admin
    .from('site_settings')
    .select('key,value')
    .in('key', [
      'deposit_enabled',
      'deposit_amount',
      'deposit_bank_name',
      'deposit_account_no',
      'deposit_holder',
      'deposit_guide',
    ]);
  const map = Object.fromEntries((settingRows ?? []).map((s) => [s.key, s.value]));

  const [pending, notifySettings] = await Promise.all([
    getPendingDeposits(),
    getDepositSettings(),
  ]);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">예약금 · 입금확인</h1>
      <p className="text-gray-500 mb-6">
        고객이 배치도에서 자리를 직접 지정해 예약하면 노쇼 방지 예약금을 받습니다. 입금이 확인되면
        예약이 확정되고 고객에게 알림톡이 발송됩니다.
      </p>
      <DepositManager
        initialPolicy={{
          enabled: map.deposit_enabled === 'true',
          amount: Number(map.deposit_amount) || 10000,
          bankName: map.deposit_bank_name ?? '',
          accountNo: map.deposit_account_no ?? '',
          holder: map.deposit_holder ?? '',
          guide: map.deposit_guide ?? '',
        }}
        initialSettings={notifySettings}
        initialPending={pending}
      />
    </div>
  );
}
