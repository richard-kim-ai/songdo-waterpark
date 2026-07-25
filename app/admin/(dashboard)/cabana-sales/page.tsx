import { requirePagePermission } from '@/lib/admin/auth';
import { getCabanaDailySales, getCabanaSalesCalendar } from '@/app/admin/actions';
import CabanaSalesManager from '../CabanaSalesManager';

export const dynamic = 'force-dynamic';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CabanaSalesAdminPage() {
  await requirePagePermission('cabana-sales');
  const initialDate = today();
  const [y, m] = initialDate.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
  const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [initialCalendar, initialDaily] = await Promise.all([
    getCabanaSalesCalendar(monthStart, monthEnd),
    getCabanaDailySales(initialDate),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">방문/매출 현황</h1>
      <p className="text-gray-500 mb-6">
        날짜를 선택해 그 날의 방문 완료 예약 기준 확정 매출과 상품별(평상&케노피/그늘막평상/썬배드)
        판매, 예약 리스트를 확인합니다.
      </p>
      <CabanaSalesManager
        initialDate={initialDate}
        initialCalendar={initialCalendar}
        initialDaily={initialDaily}
      />
    </div>
  );
}
