import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function Pricing({ tickets }: { tickets: TicketType[] }) {
  const general = tickets.filter((t) => t.category === 'general');
  const family = tickets.filter((t) => t.category === 'family_package');

  return (
    <section id="pricing" className="section-pad bg-white">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-lagoon">Admission</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-deep-tide md:text-4xl">
          입장권 안내
        </h2>
        <p className="mt-3 text-gray-600">합리적인 가격으로 즐기는 시원한 물놀이</p>
      </div>

      <div className="mb-6">
        <h3 className="mb-4 text-lg font-bold text-deep-tide">
          수영장 및 발물놀이터 입장권
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {general.map((t) => (
            <div
              key={t.id}
              className="rounded-xl2 border border-gray-100 bg-foam p-8 shadow-sm"
            >
              <p className="text-sm font-semibold text-gray-500">{t.description}</p>
              <h4 className="mt-1 text-xl font-bold text-deep-tide">{t.name}</h4>
              <p className="mt-4 text-3xl font-extrabold text-lagoon">{won(t.price)}</p>
              <button className="mt-6 w-full rounded-full bg-deep-tide py-3 text-sm font-bold text-white transition hover:bg-lagoon">
                시즌권 구매
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          시즌권 안내: 시즌 중 아무때나 이용 가능 (주중, 주말 구분 없음) · 입장 제한:
          입장객 수용 인원 초과 시 입장이 불가할 수 있습니다
        </p>
      </div>

      <div className="mt-14">
        <h3 className="mb-4 text-lg font-bold text-deep-tide">
          가족 패키지 (빅2 포함)
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {family.map((t) => (
            <div
              key={t.id}
              className="rounded-xl2 bg-gradient-to-br from-lagoon to-deep-tide p-8 text-white shadow-lg"
            >
              <h4 className="text-xl font-bold">{t.name}</h4>
              <p className="mt-1 text-sm text-white/75">{t.description}</p>
              <p className="mt-4 text-3xl font-extrabold text-sun-flare">{won(t.price)}</p>
              <button className="mt-6 w-full rounded-full bg-white py-3 text-sm font-bold text-deep-tide transition hover:brightness-95">
                패키지 구매
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-xl2 bg-seafoam/10 p-8 text-center">
        <h3 className="font-bold text-deep-tide">캠핑장 이용 고객 특별 혜택</h3>
        <p className="mt-2 text-sm text-gray-600">
          수영장 및 발물놀이터 입장권 무료 (단, 입장객 수용 인원 초과 시 입장 불가)
        </p>
      </div>
    </section>
  );
}
