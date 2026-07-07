'use client';

import { useState, useTransition } from 'react';
import { upsertTicket } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

function TicketRow({ ticket, showUsageHours }: { ticket: TicketType; showUsageHours: boolean }) {
  const [name, setName] = useState(ticket.name);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [price, setPrice] = useState(String(ticket.price));
  const [purchaseUrl, setPurchaseUrl] = useState(ticket.purchase_url ?? '');
  const [usageHours, setUsageHours] = useState(ticket.usage_hours ?? '');
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertTicket(ticket.id, {
        name,
        description,
        price: Number(price) || 0,
        purchase_url: purchaseUrl,
        usage_hours: usageHours,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-gray-600">항목명</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <label className="block text-xs font-semibold text-gray-600 mb-1">설명</label>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">가격(원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">구매 연결 링크 URL</label>
          <input
            type="text"
            value={purchaseUrl}
            onChange={(e) => setPurchaseUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {showUsageHours && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이용시간</label>
            <input
              type="text"
              value={usageHours}
              onChange={(e) => setUsageHours(e.target.value)}
              placeholder="10:00 ~ 17:30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
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

export default function TicketEditor({
  tickets,
  showUsageHours = false,
}: {
  tickets: TicketType[];
  showUsageHours?: boolean;
}) {
  return (
    <div className="space-y-4">
      {tickets.map((t) => (
        <TicketRow key={t.id} ticket={t} showUsageHours={showUsageHours} />
      ))}
      {tickets.length === 0 && (
        <p className="text-gray-500 bg-white rounded-xl p-6 shadow">항목이 없습니다.</p>
      )}
    </div>
  );
}
