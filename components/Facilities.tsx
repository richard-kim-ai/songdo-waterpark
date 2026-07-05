import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function Facilities({ tickets }: { tickets: TicketType[] }) {
  const attractions = tickets.filter((t) => t.category === 'attraction');

  return (
    <section id="facilities" className="section-pad bg-foam">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-lagoon">Attractions</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-deep-tide md:text-4xl">
          부속 놀이시설
        </h2>
        <p className="mt-3 text-gray-600">아이들이 좋아하는 신나는 놀이기구</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {attractions.map((t) => (
          <div key={t.id} className="rounded-xl2 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-deep-tide">{t.name}</h3>
            <p className="mt-2 text-sm text-gray-500">{t.description}</p>
            <p className="mt-6 text-2xl font-extrabold text-coral">{won(t.price)}</p>
            <button className="mt-6 w-full rounded-full border border-deep-tide py-3 text-sm font-bold text-deep-tide transition hover:bg-deep-tide hover:text-white">
              이용권 구매
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
