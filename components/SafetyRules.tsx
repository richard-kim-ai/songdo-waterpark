const RULES = [
  '지도자·안전요원 안전요령 숙지',
  '이용 전 준비운동 필수',
  '안전장비 착용 확인',
  '물 깊이 확인하기',
  '심신에 어려움 시 입수 금지',
  '입수시간 50분·휴식시간 10분',
  '음주는 No No',
  '절대 뛰지 않기',
  '바로 입수 금지',
  '이용 후 정리운동 꼭!',
];

export default function SafetyRules() {
  return (
    <section id="safety" className="section-pad bg-deep-tide text-white">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-sun-flare">Safety First</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
          수영장 이용 10대 안전수칙
        </h2>
        <p className="mt-3 text-white/70">안전하고 즐거운 물놀이를 위한 필수 수칙</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {RULES.map((rule, i) => (
          <div
            key={rule}
            className="flex items-center gap-4 rounded-xl2 bg-white/5 p-5 ring-1 ring-white/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun-flare text-sm font-extrabold text-deep-tide">
              {i + 1}
            </span>
            <span className="font-medium">{rule}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
