import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

const GENERAL_ICONS = ['ri-user-line', 'ri-user-smile-line', 'ri-medal-line'];

const FAMILY_STYLE = [
  {
    icon: 'ri-group-line',
    wrap: 'from-primary/5 to-primary/10 border-primary/20',
    iconWrap: 'bg-primary/20',
    iconColor: 'text-primary',
    price: 'text-primary',
    button: 'bg-primary',
  },
  {
    icon: 'ri-team-line',
    wrap: 'from-secondary/5 to-secondary/10 border-secondary/20',
    iconWrap: 'bg-secondary/20',
    iconColor: 'text-secondary',
    price: 'text-secondary',
    button: 'bg-secondary',
  },
];

export default function Pricing({
  tickets,
  sectionTitle,
  sectionSubtitle,
  poolSectionTitle,
  purchaseNotice,
  familySectionTitle,
  generalButtonLabel,
  familyButtonLabel,
  benefitTitle,
  benefitSubtitle,
  benefitNote,
  seasonPassNotice,
  entryLimitNotice,
}: {
  tickets: TicketType[];
  sectionTitle: string;
  sectionSubtitle: string;
  poolSectionTitle: string;
  purchaseNotice: string;
  familySectionTitle: string;
  generalButtonLabel: string;
  familyButtonLabel: string;
  benefitTitle: string;
  benefitSubtitle: string;
  benefitNote: string;
  seasonPassNotice: string;
  entryLimitNotice: string;
}) {
  const general = tickets.filter((t) => t.category === 'general');
  const family = tickets.filter((t) => t.category === 'family_package');

  return (
    <section id="pricing" className="py-12 md:py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          <p className="text-base md:text-lg text-gray-600">{sectionSubtitle}</p>
        </div>

        {general.length > 0 && (
        <div className="mb-16">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">{poolSectionTitle}</h3>
          <p className="text-base text-gray-600 mb-6">{purchaseNotice}</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {general.map((t, i) => {
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-xl shadow-lg p-5 md:p-8 border-2 border-transparent hover:border-primary transition-all"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mb-6">
                    <i className={`${GENERAL_ICONS[i] ?? 'ri-user-line'} text-3xl text-primary`}></i>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h4>
                  <p className="text-gray-600 mb-6">{t.description}</p>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-4 md:mb-6">
                    {t.price.toLocaleString('ko-KR')}
                    <span className="text-xl text-gray-600">원</span>
                  </div>
                  {t.purchase_url ? (
                    <a
                      href={t.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
                    >
                      {generalButtonLabel}
                    </a>
                  ) : (
                    <button className="w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer">
                      {generalButtonLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-information-line text-xl text-primary"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">시즌권 안내:</span> {seasonPassNotice}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">입장 제한:</span> {entryLimitNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {family.length > 0 && (
        <div className="mb-16">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">{familySectionTitle}</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {family.map((t, i) => {
              const style = FAMILY_STYLE[i] ?? FAMILY_STYLE[0];
              return (
                <div
                  key={t.id}
                  className={`bg-gradient-to-br rounded-xl shadow-lg p-5 md:p-8 border-2 ${style.wrap}`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 flex items-center justify-center rounded-full ${style.iconWrap}`}
                    >
                      <i className={`${style.icon} text-3xl ${style.iconColor}`}></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{t.name}</h4>
                      <p className="text-sm text-gray-600">입장권 + 빅2 놀이시설</p>
                    </div>
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold mb-4 md:mb-6 `}>
                    {t.price.toLocaleString('ko-KR')}
                    <span className="text-xl text-gray-600">원</span>
                  </div>
                  <div className={`flex items-center gap-2 mb-6 text-sm text-gray-700`}>
                    <i className={`ri-checkbox-circle-fill ${style.iconColor}`}></i>
                    <span>{t.description}</span>
                  </div>
                  {t.purchase_url ? (
                    <a
                      href={t.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-center w-full px-6 py-3 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer ${style.button}`}
                    >
                      {familyButtonLabel}
                    </a>
                  ) : (
                    <button
                      className={`w-full px-6 py-3 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer ${style.button}`}
                    >
                      {familyButtonLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-xl p-8 text-center text-white">
          <div className="w-20 h-20 flex items-center justify-center bg-white/20 rounded-full mx-auto mb-6">
            <i className="ri-tent-line text-3xl md:text-4xl"></i>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3">{benefitTitle}</h3>
          <p className="text-xl opacity-90">{benefitSubtitle}</p>
          <p className="text-sm opacity-75 mt-2">{benefitNote}</p>
        </div>
      </div>
    </section>
  );
}
