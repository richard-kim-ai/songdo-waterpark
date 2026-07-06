import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

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
  benefitTitle,
  benefitSubtitle,
  benefitNote,
}: {
  tickets: TicketType[];
  benefitTitle: string;
  benefitSubtitle: string;
  benefitNote: string;
}) {
  const general = tickets.filter((t) => t.category === 'general');
  const family = tickets.filter((t) => t.category === 'family_package');

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">입장권 안내</h2>
          <p className="text-lg text-gray-600">합리적인 가격으로 즐기는 시원한 물놀이</p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">수영장 및 발물놀이터 입장권</h3>
          <p className="text-base text-gray-600 mb-6">당일 구매 가능 (현장 상황에 따라 유동)</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {general.map((t, i) => {
              const isDiscount = t.name.includes('국가유공자');
              return (
                <div
                  key={t.id}
                  className="bg-white rounded-xl shadow-lg p-8 border-2 border-transparent hover:border-primary transition-all"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full mb-6">
                    <i className={`${GENERAL_ICONS[i] ?? 'ri-user-line'} text-3xl text-primary`}></i>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h4>
                  <p className="text-gray-600 mb-6">{isDiscount ? '특별 할인' : t.description}</p>
                  <div className="text-4xl font-bold text-primary mb-6">
                    {isDiscount ? (
                      <>
                        50%<span className="text-xl text-gray-600"> 할인</span>
                      </>
                    ) : (
                      <>
                        {t.price.toLocaleString('ko-KR')}
                        <span className="text-xl text-gray-600">원</span>
                      </>
                    )}
                  </div>
                  {t.purchase_url ? (
                    <a
                      href={t.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
                    >
                      시즌권 구매
                    </a>
                  ) : (
                    <button className="w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer">
                      시즌권 구매
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
                  <span className="font-semibold">시즌권 안내:</span> 시즌 중 아무때나 이용 가능
                  (주중, 주말 구분 없음)
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">입장 제한:</span> 입장객 수용 인원 초과 시
                  입장이 불가할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">가족 패키지 (빅2 포함)</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {family.map((t, i) => {
              const style = FAMILY_STYLE[i] ?? FAMILY_STYLE[0];
              return (
                <div
                  key={t.id}
                  className={`bg-gradient-to-br rounded-xl shadow-lg p-8 border-2 ${style.wrap}`}
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
                  <div className={`text-4xl font-bold mb-6 ${style.price}`}>
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
                      패키지 구매
                    </a>
                  ) : (
                    <button
                      className={`w-full px-6 py-3 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer ${style.button}`}
                    >
                      패키지 구매
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-xl p-8 text-center text-white">
          <div className="w-20 h-20 flex items-center justify-center bg-white/20 rounded-full mx-auto mb-6">
            <i className="ri-tent-line text-4xl"></i>
          </div>
          <h3 className="text-3xl font-bold mb-3">{benefitTitle}</h3>
          <p className="text-xl opacity-90">{benefitSubtitle}</p>
          <p className="text-sm opacity-75 mt-2">{benefitNote}</p>
        </div>
      </div>
    </section>
  );
}
