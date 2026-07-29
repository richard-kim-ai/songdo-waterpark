import type { Database } from '@/types/database';
import ZoomableImage from './ZoomableImage';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

export default function InfoNotice({
  settings,
  tickets,
  parkingImageUrl,
}: {
  settings: Record<string, string>;
  tickets: TicketType[];
  parkingImageUrl: string;
}) {
  const attractions = tickets.filter((t) => t.category === 'attraction');

  return (
    <section id="info" className="py-12 md:py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{settings.info_title}</h2>
          <p className="text-base md:text-lg text-gray-600">{settings.info_subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-primary/10 rounded-full">
                <i className="ri-time-line text-2xl md:text-3xl text-primary"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">{settings.info_pool_card_title}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">{settings.info_pool_season_label}</span>
                <span className="text-gray-700">{settings.pool_season}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">{settings.info_pool_weekday_label}</span>
                <span className="text-gray-700">{settings.pool_weekday_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">{settings.info_pool_weekend_label}</span>
                <span className="text-gray-700">{settings.pool_weekend_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">{settings.info_pool_last_entry_label}</span>
                <span className="text-secondary font-semibold">{settings.pool_last_entry}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">{settings.info_cabana_open_label}</span>
                <span className="text-gray-700">{settings.cabana_open_hours}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">{settings.info_cabana_usage_label}</span>
                <span className="text-secondary font-semibold">{settings.cabana_usage_unit}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-secondary/10 rounded-full">
                <i className="ri-service-line text-2xl md:text-3xl text-secondary"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">{settings.info_facility_card_title}</h3>
            </div>
            <div className="space-y-4">
              {attractions.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-3 ${
                    i < attractions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="font-semibold text-gray-900">{t.name}</span>
                  <span className="text-gray-700">{t.usage_hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {parkingImageUrl && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-5 md:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-primary/10 rounded-full">
                <i className="ri-parking-box-line text-2xl md:text-3xl text-primary"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">{settings.info_parking_title}</h3>
            </div>
            <ZoomableImage
              src={parkingImageUrl}
              alt={settings.info_parking_title}
              className="rounded-lg"
              imgClassName="w-full rounded-lg"
            />
          </div>
        )}
      </div>
    </section>
  );
}
