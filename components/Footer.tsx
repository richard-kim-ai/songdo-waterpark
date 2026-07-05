import { images } from '@/lib/images';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="font-pacifico text-3xl text-primary mb-6">logo</div>
            <p className="text-gray-400 leading-relaxed">
              송도국제캠핑장 물놀이장에서 가족과 함께 특별한 여름 추억을 만들어보세요
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">찾아오시는 길</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-map-pin-line text-lg"></i>
                </div>
                <p>인천광역시 연수구 송도동 123-45</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-phone-line text-lg"></i>
                </div>
                <p>032-123-4567</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-mail-line text-lg"></i>
                </div>
                <p>info@songdocamping.com</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">운영 시간</h4>
            <div className="space-y-3 text-gray-400">
              <p>하계 시즌: 6월 ~ 8월</p>
              <p>평일: 10:00 ~ 18:00</p>
              <p>주말: 09:00 ~ 19:00</p>
            </div>
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-primary transition-colors cursor-pointer"
              >
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-primary transition-colors cursor-pointer"
              >
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-primary transition-colors cursor-pointer"
              >
                <i className="ri-youtube-fill text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        <div
          className="h-64 rounded-lg overflow-hidden mb-12"
          style={{ background: `url('${images.mapPlaceholder}') center/cover no-repeat` }}
        ></div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© 2026 송도국제캠핑장. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              이용약관
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
