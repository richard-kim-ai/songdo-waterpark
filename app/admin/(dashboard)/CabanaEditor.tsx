'use client';

import { useState, useTransition } from 'react';
import { upsertCabanaZone, createCabanaZone, deleteCabanaZone } from '@/app/admin/actions';
import { ZONE_TYPES, ZONE_TYPE_LABELS, type ZoneType } from '@/lib/cabana-pricing';
import type { Database } from '@/types/database';

type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

const TIME_TYPES = ['주간', '야간', '종일'] as const;

function CabanaRow({ zone }: { zone: CabanaZone }) {
  const [name, setName] = useState(zone.name);
  const [price, setPrice] = useState(String(zone.weekday_price));
  const [unitCount, setUnitCount] = useState(String(zone.unit_count));
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const numericPrice = Number(price) || 0;
      await upsertCabanaZone(zone.id, {
        name,
        weekday_price: numericPrice,
        weekend_price: numericPrice,
        unit_count: Number(unitCount) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm(`"${zone.name}" 항목을 삭제하시겠습니까?`)) return;
    startDeleteTransition(async () => {
      await deleteCabanaZone(zone.id);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-gray-600">
          구역명{zone.time_type ? ` · ${zone.time_type}` : ''}
        </label>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 cursor-pointer"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="grid md:grid-cols-2 gap-4">
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
          <label className="block text-xs font-semibold text-gray-600 mb-1">성수기 요금(원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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

function AddZoneRow({
  zoneType,
  hasTimeType,
  nextSortOrder,
}: {
  zoneType: ZoneType;
  hasTimeType: boolean;
  nextSortOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [timeType, setTimeType] = useState<(typeof TIME_TYPES)[number]>('주간');
  const [unitCount, setUnitCount] = useState('1');
  const [price, setPrice] = useState('0');
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createCabanaZone({
        zoneType,
        timeType: hasTimeType ? timeType : null,
        name: name.trim(),
        unitCount: Number(unitCount) || 0,
        price: Number(price) || 0,
        sortOrder: nextSortOrder,
      });
      setName('');
      setUnitCount('1');
      setPrice('0');
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        + 항목 추가
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6 border-2 border-primary/30">
      <label className="block text-xs font-semibold text-gray-600 mb-1">구역명</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예: 주간 (09:30~17:00)"
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className={`grid gap-4 mb-4 ${hasTimeType ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {hasTimeType && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">시간대</label>
            <select
              value={timeType}
              onChange={(e) => setTimeType(e.target.value as (typeof TIME_TYPES)[number])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TIME_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
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
          <label className="block text-xs font-semibold text-gray-600 mb-1">성수기 요금(원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={pending}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '추가 중...' : '추가하기'}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={pending}
          className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold !rounded-button hover:bg-gray-200 transition-all disabled:opacity-50 cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function CabanaEditor({ zones }: { zones: CabanaZone[] }) {
  const maxSortOrder = zones.reduce((max, z) => Math.max(max, z.sort_order), 0);

  return (
    <div className="space-y-10">
      {ZONE_TYPES.map((zoneType) => {
        const items = zones
          .filter((z) => (z.zone_type || '케노피') === zoneType)
          .sort((a, b) => a.sort_order - b.sort_order);
        const hasTimeType = zoneType !== '썬배드';

        return (
          <div key={zoneType}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{ZONE_TYPE_LABELS[zoneType]}</h3>
            <div className="space-y-4">
              {items.map((z) => (
                <CabanaRow key={z.id} zone={z} />
              ))}
              {items.length === 0 && (
                <p className="text-gray-500 bg-white rounded-xl p-6 shadow">항목이 없습니다.</p>
              )}
              <AddZoneRow
                zoneType={zoneType}
                hasTimeType={hasTimeType}
                nextSortOrder={maxSortOrder + 1}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
