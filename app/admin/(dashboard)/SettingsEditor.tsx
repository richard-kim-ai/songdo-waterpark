'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type SiteSetting = Database['public']['Tables']['site_settings']['Row'];

const LABELS: Record<string, string> = {
  pool_season: '물놀이장 운영 시즌',
  pool_weekday_hours: '물놀이장 평일 운영시간',
  pool_weekend_hours: '물놀이장 주말 운영시간',
  pool_last_entry: '물놀이장 입장 마감 안내',
  cabana_open_hours: '카바나 이용시간',
  cabana_usage_unit: '카바나 이용 단위 안내',
  cabana_notice: '카바나 안내사항 (줄바꿈으로 구분)',
};

const ORDER = [
  'pool_season',
  'pool_weekday_hours',
  'pool_weekend_hours',
  'pool_last_entry',
  'cabana_open_hours',
  'cabana_usage_unit',
  'cabana_notice',
];

function SettingRow({ setting }: { setting: SiteSetting }) {
  const [value, setValue] = useState(setting.value);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const isMultiline = setting.key === 'cabana_notice';

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting(setting.key, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="font-bold text-gray-900">{LABELS[setting.key] ?? setting.key}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      {isMultiline ? (
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
  const sorted = [...settings].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));

  return (
    <div className="space-y-4">
      {sorted.map((s) => (
        <SettingRow key={s.key} setting={s} />
      ))}
    </div>
  );
}
