'use client';

import { useState, useTransition } from 'react';
import { replyInquiry, deleteInquiry } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type Inquiry = Database['public']['Tables']['inquiries']['Row'];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0'
  )}`;
}

function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [reply, setReply] = useState(inquiry.reply ?? '');
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await replyInquiry(inquiry.id, reply);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm('이 문의를 삭제할까요?')) return;
    startTransition(async () => {
      await deleteInquiry(inquiry.id);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">{inquiry.author_id}</span>
          <span className="text-xs text-gray-400">{formatDateTime(inquiry.created_at)}</span>
          {inquiry.reply ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              답변완료
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              답변대기
            </span>
          )}
        </div>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>

      <h3 className="font-bold text-gray-900 mb-1">{inquiry.title}</h3>
      <p className="text-gray-700 whitespace-pre-wrap mb-4 bg-gray-50 rounded-lg p-3">
        {inquiry.content}
      </p>

      <label className="block text-xs font-semibold text-gray-600 mb-1">답변</label>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        placeholder="답변을 입력하면 작성자가 아이디·비밀번호로 확인할 수 있습니다."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '저장 중...' : '답변 저장'}
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="px-6 py-2 bg-red-50 text-red-600 font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function InquiryManager({ inquiries }: { inquiries: Inquiry[] }) {
  return (
    <div className="space-y-4">
      {inquiries.map((q) => (
        <InquiryRow key={q.id} inquiry={q} />
      ))}
      {inquiries.length === 0 && (
        <p className="text-gray-500 bg-white rounded-xl p-6 shadow">등록된 문의가 없습니다.</p>
      )}
    </div>
  );
}
