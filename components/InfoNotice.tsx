export default function InfoNotice() {
  return (
    <section id="info" className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">이용시간 안내</h2>
          <p className="text-lg text-gray-600">운영 시간을 확인하고 방문 계획을 세우세요</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
                <i className="ri-time-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">물놀이장 운영시간</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">운영 시즌</span>
                <span className="text-gray-700">6월 ~ 8월 (하계)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">평일 운영</span>
                <span className="text-gray-700">10:00 ~ 18:00</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">주말 운영</span>
                <span className="text-gray-700">09:00 ~ 19:00</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">입장 마감</span>
                <span className="text-secondary font-semibold">마감 1시간 전</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 flex items-center justify-center bg-secondary/10 rounded-full">
                <i className="ri-service-line text-3xl text-secondary"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">부속시설 운영시간</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">신나는기차</span>
                <span className="text-gray-700">10:00 ~ 17:30</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">마이카</span>
                <span className="text-gray-700">10:00 ~ 17:30</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900">카바나 이용</span>
                <span className="text-gray-700">10:00 ~ 18:00</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">이용 시간</span>
                <span className="text-secondary font-semibold">30분 단위</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
