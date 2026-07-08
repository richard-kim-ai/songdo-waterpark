'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';

function LabelField({
  settingKey,
  label,
  initialValue,
}: {
  settingKey: string;
  label: string;
  initialValue: string;
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
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="font-bold text-gray-900">{label}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
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

export default function FacilitiesButtonLabels({
  rideButtonLabel,
  packageButtonLabel,
}: {
  rideButtonLabel: string;
  packageButtonLabel: string;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">버튼 명칭</h2>
      <div className="space-y-4">
        <LabelField
          settingKey="facilities_ride_button_label"
          label="개별 놀이기구 구매 버튼 명칭"
          initialValue={rideButtonLabel}
        />
        <LabelField
          settingKey="facilities_package_button_label"
          label="패키지 구매 버튼 명칭"
          initialValue={packageButtonLabel}
        />
      </div>
    </div>
  );
}
