import { createClient } from '@/lib/supabase/server';
import CabanaEditor from '../CabanaEditor';
import CabanaBookingUrl from '../CabanaBookingUrl';

export default async function CabanaAdminPage() {
  const supabase = await createClient();
  const [{ data: zones }, { data: settingRow }] = await Promise.all([
    supabase.from('cabana_zones').select('*').order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'cabana_booking_url').maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">카바나 금액 수정</h1>
      <CabanaEditor zones={zones ?? []} />
      <CabanaBookingUrl initialValue={settingRow?.value ?? ''} />
    </div>
  );
}
