import ZoomableImage from './ZoomableImage';

const COLOR_CYCLE: ('primary' | 'secondary' | 'gray')[] = [
  'primary',
  'primary',
  'primary',
  'primary',
  'secondary',
  'secondary',
  'secondary',
  'secondary',
  'gray',
  'gray',
];

const EXTRA_ICONS = ['ri-parent-line', 'ri-life-buoy-line', 'ri-first-aid-kit-line'];

const BORDER: Record<string, string> = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  gray: 'border-gray-400',
};

const BADGE: Record<string, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  gray: 'bg-gray-600',
};

// "제목|설명" 형식의 줄바꿈 목록을 파싱합니다. (관리자 '카피 수정'에서 편집)
function parsePipeList(text: string): { title: string; desc: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, desc] = line.split('|');
      return { title: (title ?? '').trim(), desc: (desc ?? '').trim() };
    });
}

export default function SafetyRules({
  imageUrl,
  title,
  subtitle,
  bannerTitle,
  rulesText,
  extraTitle,
  extraItemsText,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  bannerTitle: string;
  rulesText: string;
  extraTitle: string;
  extraItemsText: string;
}) {
  const rules = parsePipeList(rulesText);
  const extraItems = parsePipeList(extraItemsText);

  return (
    <section id="rules" className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-base md:text-lg text-gray-600">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-primary/10">
          <div className="bg-gradient-to-r from-primary to-secondary p-6">
            <h3 className="text-2xl font-bold text-white text-center">{bannerTitle}</h3>
          </div>
          <div className="p-8">
            <ZoomableImage
              src={imageUrl}
              alt="수영장 안전수칙"
              className="rounded-xl shadow-lg mb-8"
              imgClassName="w-full rounded-xl"
            />
            <div className="grid md:grid-cols-2 gap-6">
              {rules.map((rule, i) => {
                const color = COLOR_CYCLE[i] ?? 'gray';
                return (
                  <div
                    key={i}
                    className={`bg-blue-50 rounded-xl p-6 border-l-4 ${BORDER[color]}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg flex-shrink-0 ${BADGE[color]}`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{rule.title}</h4>
                        <p className="text-sm text-gray-700">{rule.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-secondary/5 rounded-2xl p-8">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-5 md:mb-6 text-center">{extraTitle}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {extraItems.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                  <i className={`${EXTRA_ICONS[i] ?? EXTRA_ICONS[0]} text-2xl text-primary`}></i>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
