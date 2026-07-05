export default function Footer() {
  return (
    <footer className="bg-deep-tide px-[6vw] py-16 text-white md:px-[8vw]">
      <div className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">
            송도국제캠핑장 <span className="text-sun-flare">물놀이장</span>
          </p>
          <p className="mt-3 text-sm text-white/70">
            가족과 함께 특별한 여름 추억을 만들어보세요
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">찾아오시는 길</p>
          <p className="mt-3 text-sm text-white/80">인천광역시 연수구 송도동 123-45</p>
          <p className="mt-1 text-sm text-white/80">032-123-4567</p>
          <p className="mt-1 text-sm text-white/80">info@songdocamping.com</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">운영 시간</p>
          <p className="mt-3 text-sm text-white/80">하계 시즌 · 6월 ~ 8월</p>
          <p className="mt-1 text-sm text-white/80">평일 10:00 ~ 18:00</p>
          <p className="mt-1 text-sm text-white/80">주말 09:00 ~ 19:00</p>
        </div>
      </div>
      <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row">
        <p>© 2026 송도국제캠핑장. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white">
            이용약관
          </a>
          <a href="#" className="hover:text-white">
            개인정보처리방침
          </a>
        </div>
      </div>
    </footer>
  );
}
