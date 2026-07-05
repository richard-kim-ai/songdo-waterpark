import { images } from '@/lib/images';

const RULES: { title: string; desc: string; color: 'primary' | 'secondary' | 'gray' }[] = [
  { title: '지도자 안전요령 숙지', desc: '수영장 이용 전 반드시 안전 수칙을 확인하세요', color: 'primary' },
  { title: '이용 전 준비운동 필수', desc: '충분한 준비운동으로 안전사고를 예방하세요', color: 'primary' },
  { title: '안전장비 착용 확인', desc: '수영모, 구명조끼 등 필요한 안전장비를 착용하세요', color: 'primary' },
  { title: '물 깊이 확인하기', desc: '입수 전 반드시 수심을 확인하고 천천히 들어가세요', color: 'primary' },
  { title: '심신에 어려움 시 입수 금지', desc: '몸 상태가 좋지 않을 때는 이용을 자제하세요', color: 'secondary' },
  { title: '입주자간 50분 휴식시간', desc: '장시간 이용 시 충분한 휴식을 취하세요', color: 'secondary' },
  { title: '음주 후 No No', desc: '음주 후에는 절대 입장 및 이용이 불가합니다', color: 'secondary' },
  { title: '절대 뛰지 않기', desc: '수영장 내에서는 걸어서 이동하세요', color: 'secondary' },
  { title: '바로 입수 금지', desc: '샤워 후 물에 서서히 적응한 뒤 입수하세요', color: 'gray' },
  { title: '청결운동 꼭!', desc: '이용 전후 반드시 샤워를 하세요', color: 'gray' },
];

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

export default function SafetyRules() {
  return (
    <section id="rules" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">수영장 안전수칙</h2>
          <p className="text-lg text-gray-600">안전하고 즐거운 물놀이를 위한 필수 수칙</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-primary/10">
          <div className="bg-gradient-to-r from-primary to-secondary p-6">
            <h3 className="text-2xl font-bold text-white text-center">수영장 이용 10대 안전수칙</h3>
          </div>
          <div className="p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.safetyRules}
              alt="수영장 안전수칙"
              className="w-full rounded-xl shadow-lg mb-8"
            />
            <div className="grid md:grid-cols-2 gap-6">
              {RULES.map((rule, i) => (
                <div
                  key={rule.title}
                  className={`bg-blue-50 rounded-xl p-6 border-l-4 ${BORDER[rule.color]}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg flex-shrink-0 ${BADGE[rule.color]}`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">{rule.title}</h4>
                      <p className="text-sm text-gray-700">{rule.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-secondary/5 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">추가 안내사항</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                <i className="ri-parent-line text-2xl text-primary"></i>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">어린이 보호자 동반</h4>
              <p className="text-sm text-gray-700">
                만 13세 이하 어린이는 반드시 보호자와 함께 이용해야 합니다
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                <i className="ri-life-buoy-line text-2xl text-primary"></i>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">안전요원 배치</h4>
              <p className="text-sm text-gray-700">
                운영시간 동안 전문 안전요원이 상주하여 안전을 관리합니다
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full mb-4">
                <i className="ri-first-aid-kit-line text-2xl text-primary"></i>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">응급처치 시설</h4>
              <p className="text-sm text-gray-700">
                응급상황 발생 시 즉시 대응할 수 있는 의료시설이 구비되어 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
