'use client';

import { useState, useTransition } from 'react';
import { createFaqItem, updateFaqItem, deleteFaqItem } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type FaqItem = Database['public']['Tables']['faq_items']['Row'];

function FaqItemRow({ item }: { item: FaqItem }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateFaqItem(item.id, { title, content, sort_order: item.sort_order });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm(`"${item.title}" 항목을 삭제할까요?`)) return;
    startTransition(async () => {
      await deleteFaqItem(item.id);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-semibold text-gray-600">항목 제목</label>
        {saved && <span className="text-xs text-green-600 font-semibold">저장됨</span>}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        내용 (줄바꿈으로 구분)
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '저장 중...' : '저장하기'}
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="px-5 py-2 bg-red-50 text-red-600 text-sm font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function FaqItemsManager({ items }: { items: FaqItem[] }) {
  const nextSortOrder = Math.max(0, ...items.map((i) => i.sort_order)) + 1;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError('');
    if (!title.trim()) {
      setError('항목 제목을 입력해주세요.');
      return;
    }
    startTransition(async () => {
      await createFaqItem({ title: title.trim(), content, sortOrder: nextSortOrder });
      setTitle('');
      setContent('');
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
        <h3 className="font-bold text-gray-900 mb-3">새 항목 추가</h3>
        <label className="block text-xs font-semibold text-gray-600 mb-1">항목 제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 반려동물 동반 안내"
          className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          내용 (줄바꿈으로 구분)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="한 줄에 하나씩 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="text-sm text-red-600 font-semibold mt-2">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={pending}
          className="mt-3 px-6 py-2 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '추가 중...' : '항목 추가'}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <FaqItemRow key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 bg-white rounded-xl p-6 shadow">등록된 항목이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
