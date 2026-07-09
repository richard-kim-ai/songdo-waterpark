import type { Database } from '@/types/database';

type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function Cabana({
  zones,
  sectionTitle,
  sectionSubtitle,
  diagramTitle,
  tableTitle,
  noticeTitle,
  cabanaNotice,
  diagramUrl,
  bookingUrl,
  bookingButtonLabel,
}: {
  zones: CabanaZone[];
  sectionTitle: string;
  sectionSubtitle: string;
  diagramTitle: string;
  tableTitle: string;
  noticeTitle: string;
  cabanaNotice: string;
  diagramUrl: string;
  bookingUrl: string;
  bookingButtonLabel: string;
}) {
  // 관리자에서 구역명을 바꿔도 깨지지 않도록, A/B/C/썬배드 구분은 이름 문자열이 아니라
  // 정렬 순서(sort_order, 이미 정렬되어 전달됨)로 판단합니다.
  const [a, b, c, sunbed] = zones;

  return (
    <section id="cabana" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          <p className="text-lg text-gray-600">{sectionSubtitle}</p>
        </div>
        <div className="grid gap-12">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{diagramTitle}</h3>
            <div className="relative bg-blue-50 rounded-lg overflow-hidden aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={diagramUrl}
                alt={diagramTitle}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{tableTitle}</h3>
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
                  <p className="text-sm font-semibold text-gray-900 mb-2">{noticeTitle}</p>
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
            {bookingUrl ? (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full mt-6 px-6 py-4 bg-primary text-white font-bold text-lg !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
              >
                {bookingButtonLabel}
              </a>
            ) : (
              <button className="w-full mt-6 px-6 py-4 bg-primary text-white font-bold text-lg !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer">
                {bookingButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
