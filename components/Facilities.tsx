import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

export default function Facilities({
  tickets,
  trainUrl,
  carUrl,
}: {
  tickets: TicketType[];
  trainUrl: string;
  carUrl: string;
}) {
  // 관리자에서 이름을 바꿔도 깨지지 않도록, 놀이기구 이미지/패키지 여부는 이름 문자열이
  // 아니라 정렬 순서(등록 순서상 마지막 = 패키지, 그 앞은 개별 놀이기구)로 판단합니다.
  const attractions = tickets.filter((t) => t.category === 'attraction');
  const rides = attractions.length > 1 ? attractions.slice(0, -1) : attractions;
  const packageTicket = attractions.length > 1 ? attractions[attractions.length - 1] : undefined;
  const RIDE_IMAGES = [trainUrl, carUrl];

  return (
    <section id="facilities" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">부속 놀이시설</h2>
          <p className="text-lg text-gray-600">아이들이 좋아하는 신나는 놀이기구</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {rides.map((t, i) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
            >
              <div
                className="h-64"
                style={{
                  background: `url('${RIDE_IMAGES[i] ?? RIDE_IMAGES[0]}') center/cover no-repeat`,
                }}
              ></div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.name}</h3>
                <p className="text-gray-600 mb-6">{t.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    {t.price.toLocaleString('ko-KR')}
                  </span>
                  <span className="text-gray-600">원 / 30분</span>
                </div>
                {t.purchase_url ? (
                  <a
                    href={t.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full px-6 py-3 bg-gray-100 text-gray-900 font-semibold !rounded-button hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer"
                  >
                    이용권 구매
                  </a>
                ) : (
                  <button className="w-full px-6 py-3 bg-gray-100 text-gray-900 font-semibold !rounded-button hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer">
                    이용권 구매
                  </button>
                )}
              </div>
            </div>
          ))}
          {packageTicket && (
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl shadow-lg p-8 flex flex-col justify-center border-2 border-secondary/30">
              <div className="w-20 h-20 flex items-center justify-center bg-secondary/20 rounded-full mx-auto mb-6">
                <i className="ri-ticket-2-line text-4xl text-secondary"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                {packageTicket.name}
              </h3>
              <p className="text-gray-600 mb-6 text-center">두 가지 놀이기구를 모두 즐기세요</p>
              <div className="flex items-baseline gap-2 mb-6 justify-center">
                <span className="text-4xl font-bold text-secondary">
                  {packageTicket.price.toLocaleString('ko-KR')}
                </span>
                <span className="text-gray-600">원</span>
              </div>
              <div className="space-y-2 mb-6">
                {rides.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <i className="ri-checkbox-circle-fill text-secondary"></i>
                    <span>{r.name} 이용권 포함</span>
                  </div>
                ))}
              </div>
              {packageTicket.purchase_url ? (
                <a
                  href={packageTicket.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full px-6 py-3 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
                >
                  패키지 구매
                </a>
              ) : (
                <button className="w-full px-6 py-3 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer">
                  패키지 구매
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
