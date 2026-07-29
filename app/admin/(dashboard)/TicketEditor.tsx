'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertTicket, createTicket } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type TicketType = Database['public']['Tables']['ticket_types']['Row'];

function TicketRow({ ticket, showUsageHours }: { ticket: TicketType; showUsageHours: boolean }) {
  const [name, setName] = useState(ticket.name);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [price, setPrice] = useState(String(ticket.price));
  const [purchaseUrl, setPurchaseUrl] = useState(ticket.purchase_url ?? '');
  const [usageHours, setUsageHours] = useState(ticket.usage_hours ?? '');
  const [isActive, setIsActive] = useState(ticket.is_active ?? true);
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
        is_active: isActive,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
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
      <label className="flex items-center gap-2 text-sm text-gray-700 mt-4">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        노출 (홈페이지에 표시)
      </label>
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

function AddTicketButton({ category, nextSortOrder }: { category: string; nextSortOrder: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      await createTicket(category, nextSortOrder);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleAdd}
      disabled={pending}
      className="w-full px-6 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-semibold !rounded-button hover:border-primary hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
    >
      {pending ? '추가 중...' : '+ 새 놀이기구 추가'}
    </button>
  );
}

export default function TicketEditor({
  tickets,
  showUsageHours = false,
  allowAdd = false,
  category,
}: {
  tickets: TicketType[];
  showUsageHours?: boolean;
  allowAdd?: boolean;
  category?: string;
}) {
  const nextSortOrder = Math.max(0, ...tickets.map((t) => t.sort_order)) + 1;

  return (
    <div className="space-y-4">
      {tickets.map((t) => (
        <TicketRow key={t.id} ticket={t} showUsageHours={showUsageHours} />
      ))}
      {tickets.length === 0 && (
        <p className="text-gray-500 bg-white rounded-xl p-6 shadow">항목이 없습니다.</p>
      )}
      {allowAdd && category && (
        <AddTicketButton category={category} nextSortOrder={nextSortOrder} />
      )}
    </div>
  );
}
