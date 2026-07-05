import { images } from '@/lib/images';

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(rgba(87, 181, 231, 0.15), rgba(87, 181, 231, 0.05)), url('${images.hero}') center/cover no-repeat`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent"></div>
      <div className="relative w-full max-w-7xl mx-auto px-6 py-32 mt-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            송도국제캠핑장
            <br />
            물놀이장에서
            <br />
            즐거운 여름을 만나세요
          </h1>
          <p className="text-xl text-gray-700 mb-10 leading-relaxed">
            시원하게 딱 트인 수영장/발물놀이터와 편안한 카바나에서
            <br />
            가족과 함께 특별한 추억을 만드세요
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="px-8 py-4 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
            >
              입장권 구매하기
            </a>
            <a
              href="#cabana"
              className="px-8 py-4 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
            >
              카바나 예약하기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
