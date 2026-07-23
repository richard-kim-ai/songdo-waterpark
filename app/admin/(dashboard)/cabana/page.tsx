import { requirePagePermission } from '@/lib/admin/auth';
import CabanaEditor from '../CabanaEditor';
import CabanaBookingUrl from '../CabanaBookingUrl';
import CabanaGuestPolicyEditor from '../CabanaGuestPolicyEditor';

export default async function CabanaAdminPage() {
  const { supabase } = await requirePagePermission('cabana');
  const [{ data: zones }, { data: settingsRows }] = await Promise.all([
    supabase.from('cabana_zones').select('*').order('sort_order'),
    supabase
      .from('site_settings')
      .select('key,value')
      .in('key', [
        'cabana_booking_url',
        'cabana_booking_button_label',
        'cabana_booking_enabled',
        'cabana_guest_base_count',
        'cabana_guest_extra_fee',
        'cabana_guest_max_count',
      ]),
  ]);
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">케노피 판매 관리</h1>
      <CabanaEditor zones={zones ?? []} />
      <CabanaBookingUrl
        initialUrl={settings.cabana_booking_url ?? ''}
        initialButtonLabel={settings.cabana_booking_button_label ?? ''}
        initialEnabled={settings.cabana_booking_enabled === 'true'}
      />
      <CabanaGuestPolicyEditor
        initialBaseCount={Number(settings.cabana_guest_base_count) || 4}
        initialExtraFee={Number(settings.cabana_guest_extra_fee) || 3000}
        initialMaxCount={Number(settings.cabana_guest_max_count) || 6}
      />
    </div>
  );
}
