'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';

function Field({
  settingKey,
  label,
  initialValue,
  placeholder,
}: {
  settingKey: string;
  label: string;
  initialValue: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting(settingKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="font-bold text-gray-900">{label}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
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

function EnabledToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(checked: boolean) {
    setEnabled(checked);
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting('cabana_booking_enabled', checked ? 'true' : 'false');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-bold text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={pending}
            onChange={(e) => handleChange(e.target.checked)}
          />
          홈페이지 실시간 예약 기능 활성화
        </label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        연결 URL을 비워두고 이 옵션을 켜면 버튼을 눌렀을 때 홈페이지 자체 실시간 예약(케노피 예약
        관리에서 확인 가능)이 열립니다. 연결 URL이 입력되어 있으면 이 옵션과 무관하게 항상 해당
        URL로 이동합니다.
      </p>
    </div>
  );
}

export default function CabanaBookingUrl({
  initialUrl,
  initialButtonLabel,
  initialEnabled,
}: {
  initialUrl: string;
  initialButtonLabel: string;
  initialEnabled: boolean;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">케노피 예약 버튼</h2>
      <div className="space-y-4">
        <Field
          settingKey="cabana_booking_button_label"
          label="예약 버튼 명칭"
          initialValue={initialButtonLabel}
        />
        <Field
          settingKey="cabana_booking_url"
          label="예약 버튼 연결 URL"
          initialValue={initialUrl}
          placeholder="https://..."
        />
        <EnabledToggle initialEnabled={initialEnabled} />
      </div>
    </div>
  );
}
