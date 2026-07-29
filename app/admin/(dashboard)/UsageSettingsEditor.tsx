'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';

function Field({
  settingKey,
  label,
  initialValue,
  placeholder,
  hint,
}: {
  settingKey: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting(settingKey, value.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <label className="font-bold text-gray-900">{label}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {pending ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

export default function UsageSettingsEditor({
  gaMeasurementId,
  supabaseUrl,
  vercelUrl,
  gaUrl,
}: {
  gaMeasurementId: string;
  supabaseUrl: string;
  vercelUrl: string;
  gaUrl: string;
}) {
  return (
    <div className="space-y-4">
      <Field
        settingKey="ga_measurement_id"
        label="Google Analytics 측정 ID"
        initialValue={gaMeasurementId}
        placeholder="G-XXXXXXXXXX"
        hint="GA4 측정 ID를 입력하면 홈페이지에 방문자 추적 코드가 자동 삽입됩니다. 비워두면 추적하지 않습니다."
      />
      <Field
        settingKey="usage_supabase_url"
        label="Supabase 대시보드 링크"
        initialValue={supabaseUrl}
        placeholder="https://supabase.com/dashboard/project/..."
        hint="DB·스토리지 사용량 및 대역폭 상세는 Supabase 대시보드에서 확인합니다."
      />
      <Field
        settingKey="usage_vercel_url"
        label="Vercel 대시보드 링크"
        initialValue={vercelUrl}
        placeholder="https://vercel.com/.../analytics"
        hint="배포·트래픽·대역폭은 Vercel 대시보드의 Analytics/Usage에서 확인합니다."
      />
      <Field
        settingKey="usage_ga_url"
        label="Google Analytics 대시보드 링크"
        initialValue={gaUrl}
        placeholder="https://analytics.google.com/..."
        hint="방문자·유입 경로 등 접속 통계는 Google Analytics에서 확인합니다."
      />
    </div>
  );
}
