export default function InfoNotice() {
  return (
    <section id="info" className="section-pad bg-white">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-lagoon">Operating Hours</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-deep-tide md:text-4xl">
          이용시간 안내
        </h2>
        <p className="mt-3 text-gray-600">운영 시간을 확인하고 방문 계획을 세우세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl2 bg-foam p-8">
          <h3 className="font-bold text-deep-tide">물놀이장 운영시간</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>운영 시즌 · 6월 ~ 8월 (하계)</li>
            <li>평일 운영 · 10:00 ~ 18:00</li>
            <li>주말 운영 · 09:00 ~ 19:00</li>
            <li>입장 마감 · 마감 1시간 전</li>
          </ul>
        </div>
        <div className="rounded-xl2 bg-foam p-8">
          <h3 className="font-bold text-deep-tide">부속시설 운영시간</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>신나는기차 · 10:00 ~ 17:30</li>
            <li>마이카 · 10:00 ~ 17:30</li>
            <li>카바나 이용 · 10:00 ~ 18:00</li>
            <li>이용 시간 30분 단위</li>
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-4 text-sm text-gray-600 md:grid-cols-3">
        {['준비물 안내', '환불 규정', '주차 안내', '샤워실 및 탈의실', '안전 수칙', '문의 사항'].map(
          (item) => (
            <div key={item} className="rounded-xl border border-gray-100 p-5">
              {item}
            </div>
          )
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-8 rounded-xl2 bg-deep-tide p-8 text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">전화 문의</p>
          <p className="mt-1 text-lg font-bold">032-123-4567</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">이메일 문의</p>
          <p className="mt-1 text-lg font-bold">info@songdocamping.com</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">운영 시간</p>
          <p className="mt-1 text-lg font-bold">평일 09:00 ~ 18:00</p>
        </div>
      </div>
    </section>
  );
}
