'use client';

import { useState } from 'react';

const ITEMS = [
  {
    title: '준비물 안내',
    icon: 'ri-checkbox-circle-fill',
    color: 'text-primary',
    lines: [
      '수영복, 수영모, 수건 등 개인 물놀이 용품',
      '여벌 옷과 샌들 또는 아쿠아슈즈',
      '자외선 차단제 (SPF 50 이상 권장)',
      '방수 가방 및 귀중품 보관용 지퍼백',
    ],
  },
  {
    title: '안전 수칙',
    icon: 'ri-error-warning-fill',
    color: 'text-secondary',
    lines: [
      '어린이는 반드시 보호자 동반 하에 이용해주세요',
      '물놀이장 내에서는 뛰거나 장난치지 마세요',
      '음주 후 입장 및 이용이 금지됩니다',
      '유리병 등 깨지기 쉬운 물품 반입 금지',
    ],
  },
  {
    title: '환불 규정',
    icon: 'ri-information-fill',
    color: 'text-primary',
    lines: [
      '이용일 7일 전: 100% 환불',
      '이용일 3~6일 전: 50% 환불',
      '이용일 2일 전~당일: 환불 불가',
      '기상 악화로 인한 운영 중단 시 전액 환불',
    ],
  },
  {
    title: '주차 안내',
    icon: 'ri-parking-box-fill',
    color: 'text-primary',
    lines: [
      '무료 주차장 이용 가능 (200대 수용)',
      '주차장에서 물놀이장까지 도보 3분 거리',
      '주말 및 성수기에는 주차 공간이 부족할 수 있습니다',
      '대중교통 이용을 권장합니다',
    ],
  },
  {
    title: '샤워실 및 탈의실',
    icon: 'ri-home-heart-fill',
    color: 'text-primary',
    lines: [
      '남녀 구분된 샤워실 및 탈의실 운영',
      '온수 샤워 시설 완비',
      '헤어드라이어 및 기본 어메니티 제공',
      '물놀이장 입구 좌측에 위치',
    ],
  },
];

const CONTACT = {
  title: '문의 사항',
  entries: [
    { icon: 'ri-phone-fill', label: '전화 문의', value: '032-123-4567' },
    { icon: 'ri-time-fill', label: '운영 시간', value: '평일 09:00 ~ 18:00' },
    { icon: 'ri-mail-fill', label: '이메일 문의', value: 'info@songdocamping.com' },
  ],
};

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen((cur) => (cur === i ? null : i));

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">이용 안내 및 주의사항</h2>
          <p className="text-lg text-gray-600">안전하고 즐거운 이용을 위해 확인해주세요</p>
        </div>
        <div className="space-y-4">
          {ITEMS.map((item, i) => (
            <div key={item.title} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-lg text-gray-900">{item.title}</span>
                <div className="w-6 h-6 flex items-center justify-center">
                  <i
                    className={`ri-arrow-down-s-line text-2xl text-gray-600 transition-transform ${
                      open === i ? 'rotate-180' : ''
                    }`}
                  ></i>
                </div>
              </button>
              {open === i && (
                <div className="px-8 pb-6">
                  <ul className="space-y-3 text-gray-700">
                    {item.lines.map((line) => (
                      <li key={line} className="flex items-start gap-3">
                        <i className={`${item.icon} ${item.color} mt-1`}></i>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggle(ITEMS.length)}
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-lg text-gray-900">{CONTACT.title}</span>
              <div className="w-6 h-6 flex items-center justify-center">
                <i
                  className={`ri-arrow-down-s-line text-2xl text-gray-600 transition-transform ${
                    open === ITEMS.length ? 'rotate-180' : ''
                  }`}
                ></i>
              </div>
            </button>
            {open === ITEMS.length && (
              <div className="px-8 pb-6">
                <div className="space-y-4 text-gray-700">
                  {CONTACT.entries.map((entry) => (
                    <div key={entry.label} className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full">
                        <i className={`${entry.icon} text-xl text-primary`}></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{entry.label}</p>
                        <p>{entry.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
