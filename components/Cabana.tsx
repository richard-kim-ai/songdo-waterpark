import type { Database } from '@/types/database';

type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function Cabana({
  zones,
  cabanaNotice,
  diagramUrl,
}: {
  zones: CabanaZone[];
  cabanaNotice: string;
  diagramUrl: string;
}) {
  // 관리자에서 구역명을 바꿔도 깨지지 않도록, A/B/C/썬배드 구분은 이름 문자열이 아니라
  // 정렬 순서(sort_order, 이미 정렬되어 전달됨)로 판단합니다.
  const [a, b, c, sunbed] = zones;

  return (
    <section id="cabana" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">카바나 예약</h2>
          <p className="text-lg text-gray-600">프라이빗한 공간에서 편안한 휴식을 즐기세요</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">카바나 배치도</h3>
            <div className="relative bg-blue-50 rounded-lg p-8 aspect-square">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={diagramUrl}
                  alt="카바나 배치도"
                  className="w-full h-full object-contain"
                />
              </div>
              {a && (
                <div className="absolute top-2 left-2 sm:top-12 sm:left-12 bg-white rounded-lg shadow-md px-2 py-1 sm:px-4 sm:py-2">
                  <span className="text-xs sm:text-base font-semibold text-primary">{a.name}</span>
                </div>
              )}
              {b && (
                <div className="absolute top-2 right-2 sm:top-12 sm:right-12 bg-white rounded-lg shadow-md px-2 py-1 sm:px-4 sm:py-2">
                  <span className="text-xs sm:text-base font-semibold text-primary">{b.name}</span>
                </div>
              )}
              {c && (
                <div className="absolute bottom-2 left-2 sm:bottom-24 sm:left-12 bg-white rounded-lg shadow-md px-2 py-1 sm:px-4 sm:py-2">
                  <span className="text-xs sm:text-base font-semibold text-secondary">{c.name}</span>
                </div>
              )}
              {sunbed && (
                <div className="absolute bottom-2 right-2 sm:bottom-24 sm:right-12 bg-white rounded-lg shadow-md px-2 py-1 sm:px-4 sm:py-2">
                  <span className="text-xs sm:text-base font-semibold text-gray-900">{sunbed.name}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {a && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="font-semibold text-gray-900">{a.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {a.unit_count}개 / 주말 {won(a.weekend_price)} / 주중 {won(a.weekday_price)}
                  </p>
                </div>
              )}
              {b && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="font-semibold text-gray-900">{b.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {b.unit_count}개 / 주말 {won(b.weekend_price)} / 주중 {won(b.weekday_price)}
                  </p>
                </div>
              )}
              {c && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-secondary rounded"></div>
                    <span className="font-semibold text-gray-900">{c.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {c.unit_count}개 / 주말 {won(c.weekend_price)} / 주중 {won(c.weekday_price)}
                  </p>
                </div>
              )}
              {sunbed && (
                <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-secondary/50 rounded"></div>
                    <span className="font-semibold text-gray-900">{sunbed.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{won(sunbed.weekday_price)} / 개당 이용</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">구역별 금액 안내</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="px-6 py-4 font-bold text-base border border-primary/20">
                      타입
                    </th>
                    <th className="px-6 py-4 font-bold text-base border border-primary/20 text-center">
                      개수 (EA)
                    </th>
                    <th className="px-6 py-4 font-bold text-base border border-primary/20 text-right">
                      주말 요금
                    </th>
                    <th className="px-6 py-4 font-bold text-base border border-primary/20 text-right">
                      주중 요금
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[a, b, c].filter(Boolean).map((z) => (
                    <tr key={z!.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 border border-gray-200 font-semibold text-gray-900">
                        {z!.name}
                      </td>
                      <td className="px-6 py-4 border border-gray-200 text-center text-primary font-bold">
                        {z!.unit_count}
                      </td>
                      <td className="px-6 py-4 border border-gray-200 text-right font-bold text-gray-900">
                        {won(z!.weekend_price)}
                      </td>
                      <td className="px-6 py-4 border border-gray-200 text-right font-bold text-gray-900">
                        {won(z!.weekday_price)}
                      </td>
                    </tr>
                  ))}
                  {sunbed && (
                    <tr className="bg-gradient-to-r from-primary/5 to-secondary/5">
                      <td className="px-6 py-4 border border-gray-200 font-bold text-gray-900">
                        {sunbed.name}
                      </td>
                      <td className="px-6 py-4 border border-gray-200 text-center font-bold text-secondary">
                        {sunbed.unit_count}
                      </td>
                      <td
                        className="px-6 py-4 border border-gray-200 text-center font-bold text-gray-900"
                        colSpan={2}
                      >
                        {won(sunbed.weekday_price)} / 개당 이용
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-information-line text-xl text-primary"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">안내사항</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {cabanaNotice
                      .split('\n')
                      .filter((line) => line.trim())
                      .map((line, i) => (
                        <li key={i}>• {line}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 px-6 py-4 bg-primary text-white font-bold text-lg !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer">
              카바나 예약하기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
