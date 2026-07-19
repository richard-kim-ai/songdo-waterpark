import { requirePagePermission } from '@/lib/admin/auth';
import TicketEditor from '../TicketEditor';
import FacilitiesButtonLabels from '../FacilitiesButtonLabels';

export default async function FacilitiesAdminPage() {
  const { supabase } = await requirePagePermission('facilities');
  const [{ data: tickets }, { data: settingsRows }] = await Promise.all([
    supabase.from('ticket_types').select('*').eq('category', 'attraction').order('sort_order'),
    supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['facilities_ride_button_label']),
  ]);
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">부속시설 관리</h1>
      <p className="text-gray-500 mb-6">
        부속 놀이시설(신나는기차, 마이카, 물놀이 다람쥐통 대여)의 이름, 설명, 가격, 이용시간,
        구매 링크, 노출여부를 관리하고 새 놀이기구를 추가할 수 있습니다.
      </p>
      <TicketEditor tickets={tickets ?? []} showUsageHours allowAdd category="attraction" />
      <FacilitiesButtonLabels rideButtonLabel={settings.facilities_ride_button_label ?? ''} />
    </div>
  );
}
