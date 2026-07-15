'use client';

import { useTransition } from 'react';
import { createPopup, updatePopup, deletePopup } from '@/app/admin/actions';
import { useResizingFormAction } from '@/lib/admin/useResizingFormAction';
import { publicUrl } from '@/lib/images';
import type { Database } from '@/types/database';

type Popup = Database['public']['Tables']['popups']['Row'];

function PopupRow({ popup }: { popup: Popup }) {
  const [deleting, startDelete] = useTransition();
  const boundUpdate = updatePopup.bind(null, popup.id);
  const { pending: updating, onSubmit } = useResizingFormAction(boundUpdate);

  function handleDelete() {
    if (!confirm('이 팝업을 삭제할까요?')) return;
    startDelete(async () => {
      await deletePopup(popup.id, popup.image_path);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="flex items-start gap-4">
        {popup.image_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicUrl(popup.image_path)}
            alt={popup.title}
            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
          />
        )}
        <div className="flex-1 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
            <input
              name="title"
              defaultValue={popup.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">연결 링크 URL</label>
            <input
              name="link_url"
              defaultValue={popup.link_url ?? ''}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이미지 교체</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full text-sm text-gray-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시작일</label>
              <input
                type="date"
                name="start_date"
                defaultValue={popup.start_date ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">종료일</label>
              <input
                type="date"
                name="end_date"
                defaultValue={popup.end_date ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={popup.sort_order}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="is_active" defaultChecked={popup.is_active} />
            활성화 (홈페이지에 노출)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="show_together" defaultChecked={popup.show_together} />
            동시 노출 (PC에서 다른 팝업과 나란히 표시, 모바일은 순차 노출)
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={updating}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {updating ? '업로드 중...' : '저장하기'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-2 bg-red-50 text-red-600 font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
        >
          삭제
        </button>
      </div>
    </form>
  );
}

export default function PopupManager({ popups }: { popups: Popup[] }) {
  const { pending, onSubmit } = useResizingFormAction(createPopup);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">새 팝업 등록</h2>
        <form key={popups.length} onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
            <input
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">연결 링크 URL</label>
            <input
              name="link_url"
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이미지</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              className="w-full text-sm text-gray-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시작일</label>
              <input
                type="date"
                name="start_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">종료일</label>
              <input
                type="date"
                name="end_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="is_active" defaultChecked />
            활성화 (홈페이지에 노출)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="show_together" />
            동시 노출 (PC에서 다른 팝업과 나란히 표시, 모바일은 순차 노출)
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-3 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {pending ? '업로드 중...' : '팝업 등록'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {popups.map((p) => (
          <PopupRow key={p.id} popup={p} />
        ))}
        {popups.length === 0 && (
          <p className="text-gray-500 bg-white rounded-xl p-6 shadow">등록된 팝업이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
