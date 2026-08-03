'use client';

import { useState } from 'react';

/**
 * 알림 연동(관리자 카카오톡 / 고객 알림톡 / 텔레그램)을 한 화면에서 탭으로 관리한다.
 * 각 패널은 서버 컴포넌트에서 만들어 children으로 넘어온다.
 */
export default function NotifyTabs({
  kakaoPanel,
  aligoPanel,
  telegramPanel,
  initialTab = 'telegram',
}: {
  kakaoPanel: React.ReactNode;
  aligoPanel: React.ReactNode;
  telegramPanel: React.ReactNode;
  initialTab?: 'telegram' | 'kakao' | 'aligo';
}) {
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    { key: 'telegram' as const, label: '텔레그램', hint: '관리자 · 무료' },
    { key: 'kakao' as const, label: '카카오톡', hint: '관리자 · 무료' },
    { key: 'aligo' as const, label: '알림톡', hint: '고객 · 유료' },
  ];

  return (
    <div>
      <div className="bg-white rounded-xl shadow p-1.5 sm:p-2 flex gap-1 sm:gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-1 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="block truncate">{t.label}</span>
            <span className="block text-[10px] font-normal opacity-70">{t.hint}</span>
          </button>
        ))}
      </div>

      <div className={tab === 'telegram' ? '' : 'hidden'}>{telegramPanel}</div>
      <div className={tab === 'kakao' ? '' : 'hidden'}>{kakaoPanel}</div>
      <div className={tab === 'aligo' ? '' : 'hidden'}>{aligoPanel}</div>
    </div>
  );
}
