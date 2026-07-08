import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

export default function InfoNotice({
  settings,
  tickets,
}: {
  settings: Record<string, string>;
  tickets: TicketType[];
}) {
  // 관리자에서 이름을 바꿔도 깨지지 않도록, 패키지 이용권 제외는 이름 문자열이 아니라
  // 정렬 순서상 마지막 항목(등록 순서상 패키지)으로 판단합니다. (Facilities.tsx와 동일한 규칙)
  const attractionsAll = tickets.filter((t) => t.category === 'attraction');
  const attractions =
    attractionsAll.length > 1 ? attractionsAll.slice(0, -1) : attractionsAll;

  return (
    <section id="info" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{settings.info_title}</h2>
          <p className="text-lg text-gray-600">{settings.info_subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
                <i className="ri-time-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{settings.info_pool_card_title}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">운영 시즌</span>
                <span className="text-gray-700">{settings.pool_season}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">평일 운영</span>
                <span className="text-gray-700">{settings.pool_weekday_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">주말 운영</span>
                <span className="text-gray-700">{settings.pool_weekend_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">입장 마감</span>
                <span className="text-secondary font-semibold">{settings.pool_last_entry}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-secondary/10 rounded-full">
                <i className="ri-service-line text-3xl text-secondary"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{settings.info_facility_card_title}</h3>
            </div>
            <div className="space-y-4">
              {attractions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <span className="font-semibold text-gray-900">{t.name}</span>
                  <span className="text-gray-700">{t.usage_hours}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">케노피 이용</span>
                <span className="text-gray-700">{settings.cabana_open_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">이용 시간</span>
                <span className="text-secondary font-semibold">{settings.cabana_usage_unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
