'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type SiteSetting = Database['public']['Tables']['site_settings']['Row'];

type FieldConfig = { key: string; label: string; multiline?: boolean };

const SECTIONS: { title: string; description?: string; fields: FieldConfig[] }[] = [
  {
    title: '메인 화면 (Hero)',
    description: '홈페이지 맨 위 큰 배경 이미지 위에 표시되는 문구입니다.',
    fields: [
      { key: 'hero_title', label: '메인 제목 (굵고 큰 글씨, 줄바꿈으로 여러 줄 입력 가능)', multiline: true },
      { key: 'hero_subtitle', label: '메인 설명 문구 (제목 아래 작은 글씨)', multiline: true },
    ],
  },
  {
    title: '중간 배너 (캠핑장 이용 고객 특별 혜택)',
    fields: [
      { key: 'benefit_title', label: '배너 제목' },
      { key: 'benefit_subtitle', label: '배너 부제목' },
      { key: 'benefit_note', label: '배너 안내 문구 (괄호 안내문)' },
    ],
  },
  {
    title: '이용시간 안내',
    fields: [
      { key: 'pool_season', label: '물놀이장 운영 시즌' },
      { key: 'pool_weekday_hours', label: '물놀이장 평일 운영시간' },
      { key: 'pool_weekend_hours', label: '물놀이장 주말 운영시간' },
      { key: 'pool_last_entry', label: '물놀이장 입장 마감 안내' },
      { key: 'cabana_open_hours', label: '카바나 이용시간' },
      { key: 'cabana_usage_unit', label: '카바나 이용 단위 안내' },
      { key: 'cabana_notice', label: '카바나 안내사항 (줄바꿈으로 구분)', multiline: true },
    ],
  },
  {
    title: '이용안내 및 주의사항 (안전수칙 상단)',
    fields: [
      { key: 'safety_title', label: '안전수칙 섹션 제목' },
      { key: 'safety_subtitle', label: '안전수칙 섹션 설명' },
    ],
  },
  {
    title: '푸터',
    fields: [
      { key: 'footer_address', label: '주소' },
      { key: 'footer_phone', label: '전화번호' },
      { key: 'footer_email', label: '이메일' },
      { key: 'footer_copyright', label: '저작권 문구' },
    ],
  },
];

function SettingRow({ value: initialValue, field }: { value: string; field: FieldConfig }) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting(field.key, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="font-bold text-gray-900">{field.label}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      {field.multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
      <button
        onClick={handleSave}
        disabled={pending}
        className="mt-4 px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {pending ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

export default function SettingsEditor({ settings }: { settings: SiteSetting[] }) {
  const valueMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-10">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-gray-500 mb-4">{section.description}</p>
          )}
          <div className="space-y-4">
            {section.fields.map((field) => (
              <SettingRow key={field.key} field={field} value={valueMap[field.key] ?? ''} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
