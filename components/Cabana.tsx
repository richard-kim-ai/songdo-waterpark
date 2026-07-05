import type { Database } from '@/types/database';

type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

const ZONE_COLORS: Record<string, string> = {
  'A타입 (4인)': 'border-seafoam',
  'B타입 (3인)': 'border-lagoon',
  'C타입 (2인)': 'border-santorini',
  '썬배드 구역': 'border-coral',
};

export default function Cabana({ zones }: { zones: CabanaZone[] }) {
  return (
    <section id="cabana" className="section-pad bg-white">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-lagoon">Cabana Reservation</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-deep-tide md:text-4xl">
          카바나 예약
        </h2>
        <p className="mt-3 text-gray-600">프라이빗한 공간에서 편안한 휴식을 즐기세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {zones.map((z) => (
          <div
            key={z.id}
            className={`rounded-xl2 border-t-4 bg-foam p-6 shadow-sm ${
              ZONE_COLORS[z.name] ?? 'border-deep-tide'
            }`}
          >
            <h3 className="text-lg font-bold text-deep-tide">{z.name}</h3>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              {z.unit_count}개 유닛 · 정원 {z.capacity}인
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                <span className="text-gray-500">주중</span>
                <span className="font-bold text-deep-tide">{won(z.weekday_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">주말·공휴일</span>
                <span className="font-bold text-deep-tide">{won(z.weekend_price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl2 bg-deep-tide/5 p-6 text-sm text-gray-600">
        <p>• 카바나는 일별 사용권으로 판매됩니다</p>
        <p>• 썬배드는 카바나 예약 시 추가로 선택 가능합니다</p>
        <p>• 주말 요금은 금요일, 토요일, 일요일 및 공휴일에 적용됩니다</p>
      </div>

      <div className="mt-8 text-center">
        <a
          href="#cabana"
          className="inline-block rounded-full bg-santorini px-8 py-3 text-sm font-bold text-white transition hover:brightness-95"
        >
          카바나 예약하기
        </a>
      </div>
    </section>
  );
}
