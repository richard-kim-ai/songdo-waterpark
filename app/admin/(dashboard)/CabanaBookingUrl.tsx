'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';

export default function CabanaBookingUrl({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting('cabana_booking_url', value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">카바나 예약하기 연결 URL</h2>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <label className="font-bold text-gray-900">
            &ldquo;카바나 예약하기&rdquo; 버튼 연결 링크
          </label>
          {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://..."
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
    </div>
  );
}
