export default function Hero() {
  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden bg-gradient-to-br from-deep-tide via-lagoon to-[#35b7c9] px-[6vw] pt-24 text-white md:px-[8vw]">
      <span className="eyebrow text-sun-flare">Songdo Water World</span>
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight tracking-tight md:text-6xl">
        송도국제캠핑장 물놀이장에서 <br />
        즐거운 <span className="text-sun-flare">여름</span>을 만나세요
      </h1>
      <p className="mt-6 max-w-xl text-base text-white/85 md:text-lg">
        시원한 발물놀이터와 편안한 카바나에서 가족과 함께 특별한 추억을 만드세요.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href="#pricing"
          className="rounded-full bg-sun-flare px-7 py-3 text-sm font-bold text-deep-tide transition hover:brightness-95"
        >
          입장권 구매하기
        </a>
        <a
          href="#cabana"
          className="rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
        >
          카바나 예약하기
        </a>
      </div>
    </section>
  );
}
