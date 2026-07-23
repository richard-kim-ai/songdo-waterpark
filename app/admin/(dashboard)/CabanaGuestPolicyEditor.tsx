'use client';

import { useState, useTransition } from 'react';
import { saveCabanaGuestPolicy } from '@/app/admin/actions';

export default function CabanaGuestPolicyEditor({
  initialBaseCount,
  initialExtraFee,
  initialMaxCount,
}: {
  initialBaseCount: number;
  initialExtraFee: number;
  initialMaxCount: number;
}) {
  const [baseCount, setBaseCount] = useState(initialBaseCount);
  const [extraFee, setExtraFee] = useState(initialExtraFee);
  const [maxCount, setMaxCount] = useState(initialMaxCount);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    setSaved(false);
    if (maxCount < baseCount) {
      setError('최대 예약 가능 인원은 기본 인원수보다 크거나 같아야 합니다.');
      return;
    }
    startTransition(async () => {
      try {
        await saveCabanaGuestPolicy({ baseCount, extraFee, maxCount });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">예약 인원 한계 조정</h2>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-xs text-gray-500 mb-4">
          예) 기본 4명까지는 기본요금, 초과 인원 1명당 3,000원 추가, 최대 6명(또는 12명 등)까지
          예약 가능하도록 설정할 수 있습니다. 최대 인원을 초과하면 고객 화면에 케노피 추가 예약
          안내 문구가 표시됩니다.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <label className="text-sm text-gray-600">
            기본 인원수 (명)
            <input
              type="number"
              min={1}
              value={baseCount}
              onChange={(e) => setBaseCount(Number(e.target.value) || 1)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="text-sm text-gray-600">
            추가 인원당 요금 (원)
            <input
              type="number"
              min={0}
              step={100}
              value={extraFee}
              onChange={(e) => setExtraFee(Number(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="text-sm text-gray-600">
            최대 예약 가능 인원 (명)
            <input
              type="number"
              min={1}
              value={maxCount}
              onChange={(e) => setMaxCount(Number(e.target.value) || 1)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>}
        {saved && <p className="text-sm text-green-600 font-semibold mb-3">저장됨</p>}
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
