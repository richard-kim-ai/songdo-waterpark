const ITEMS = [
  '물놀이장 전경',
  '발물놀이터',
  '카바나 내부',
  '카바나 외부',
  '신나는기차',
  '캠핑장 전경',
];

export default function Gallery() {
  return (
    <section id="gallery" className="section-pad bg-foam">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow text-lagoon">Gallery</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-deep-tide md:text-4xl">
          포토 갤러리
        </h2>
        <p className="mt-3 text-gray-600">송도국제캠핑장 물놀이장의 생생한 모습</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {ITEMS.map((label) => (
          <div
            key={label}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl2 bg-gradient-to-br from-lagoon/30 to-deep-tide/40"
          >
            {/* 실제 이미지는 Supabase Storage에 업로드 후 next/image로 교체하세요 */}
            <div className="flex h-full items-center justify-center text-sm font-semibold text-deep-tide/50">
              {label} 이미지 준비중
            </div>
            <span className="absolute bottom-3 left-4 text-sm font-bold text-white drop-shadow">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
