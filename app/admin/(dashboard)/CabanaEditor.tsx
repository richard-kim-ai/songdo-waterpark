'use client';

import { useState, useTransition } from 'react';
import { upsertCabanaZone } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

function CabanaRow({ zone }: { zone: CabanaZone }) {
  const [weekdayPrice, setWeekdayPrice] = useState(String(zone.weekday_price));
  const [weekendPrice, setWeekendPrice] = useState(String(zone.weekend_price));
  const [unitCount, setUnitCount] = useState(String(zone.unit_count));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertCabanaZone(zone.id, {
        weekday_price: Number(weekdayPrice) || 0,
        weekend_price: Number(weekendPrice) || 0,
        unit_count: Number(unitCount) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{zone.name}</h3>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">개수(EA)</label>
          <input
            type="number"
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">주중 요금(원)</label>
          <input
            type="number"
            value={weekdayPrice}
            onChange={(e) => setWeekdayPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">주말 요금(원)</label>
          <input
            type="number"
            value={weekendPrice}
            onChange={(e) => setWeekendPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
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

export default function CabanaEditor({ zones }: { zones: CabanaZone[] }) {
  return (
    <div className="space-y-4">
      {zones.map((z) => (
        <CabanaRow key={z.id} zone={z} />
      ))}
      {zones.length === 0 && (
        <p className="text-gray-500 bg-white rounded-xl p-6 shadow">항목이 없습니다.</p>
      )}
    </div>
  );
}
