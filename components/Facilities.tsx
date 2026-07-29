import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

export default function Facilities({
  tickets,
  trainUrl,
  carUrl,
  squirrelTubUrl,
  sectionTitle,
  sectionSubtitle,
  rideButtonLabel,
}: {
  tickets: TicketType[];
  trainUrl: string;
  carUrl: string;
  squirrelTubUrl: string;
  sectionTitle: string;
  sectionSubtitle: string;
  rideButtonLabel: string;
}) {
  const attractions = tickets.filter((t) => t.category === 'attraction');
  const RIDE_IMAGES = [trainUrl, carUrl, squirrelTubUrl];

  if (attractions.length === 0) return null;

  return (
    <section id="facilities" className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          <p className="text-base md:text-lg text-gray-600">{sectionSubtitle}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {attractions.map((t, i) => (
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
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{t.name}</h3>
                <p className="text-gray-600 mb-6">{t.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    {t.price.toLocaleString('ko-KR')}
                  </span>
                  <span className="text-gray-600">원</span>
                </div>
                {t.purchase_url ? (
                  <a
                    href={t.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full px-6 py-3 bg-gray-100 text-gray-900 font-semibold !rounded-button hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer"
                  >
                    {rideButtonLabel}
                  </a>
                ) : (
                  <button className="w-full px-6 py-3 bg-gray-100 text-gray-900 font-semibold !rounded-button hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer">
                    {rideButtonLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
