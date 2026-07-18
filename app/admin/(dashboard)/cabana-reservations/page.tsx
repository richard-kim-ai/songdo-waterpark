import { createAdminClient } from '@/lib/supabase/admin';
import CabanaReservationManager from '../CabanaReservationManager';

export const dynamic = 'force-dynamic';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CabanaReservationsAdminPage() {
  const admin = createAdminClient();
  const initialDate = today();

  const { data } = await admin
    .from('cabana_reservations')
    .select('*')
    .eq('reservation_date', initialDate)
    .order('cabana_no');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">케노피 예약 관리</h1>
      <p className="text-gray-500 mb-6">
        홈페이지에서 접수된 케노피 실시간 예약을 날짜별로 확인하고, 예약 내용을 수정하거나
        취소할 수 있습니다.
      </p>
      <CabanaReservationManager initialDate={initialDate} initialReservations={data ?? []} />
    </div>
  );
}
