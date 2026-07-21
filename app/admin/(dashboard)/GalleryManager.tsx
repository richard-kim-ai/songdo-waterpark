'use client';

import { useState, useTransition } from 'react';
import { createGalleryImage, updateGalleryImage, deleteGalleryImage } from '@/app/admin/actions';
import { useResizingFormAction } from '@/lib/admin/useResizingFormAction';
import { publicUrl } from '@/lib/images';
import type { Database } from '@/types/database';

type GalleryImage = Database['public']['Tables']['gallery_images']['Row'];

function GalleryRow({ image }: { image: GalleryImage }) {
  const [label, setLabel] = useState(image.label);
  const [sortOrder, setSortOrder] = useState(String(image.sort_order));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateGalleryImage(image.id, { label, sort_order: Number(sortOrder) || 0 });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm('이 이미지를 삭제할까요?')) return;
    startTransition(async () => {
      await deleteGalleryImage(image.id, image.image_path);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={publicUrl(image.image_path)}
        alt={label}
        className="w-24 h-24 object-cover rounded-lg border border-gray-200 shrink-0"
      />
      <div className="flex-1 w-full grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">라벨</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
        {saved && <span className="text-xs text-green-600 font-semibold text-center">저장됨</span>}
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { pending, onSubmit } = useResizingFormAction(createGalleryImage);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">새 이미지 등록</h2>
        <form key={images.length} onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">라벨</label>
            <input
              name="label"
              required
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이미지 파일</label>
            <input type="file" name="image" accept="image/*" required className="text-sm text-gray-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={images.length + 1}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-3 bg-secondary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {pending ? '업로드 중...' : '등록'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {images.map((img) => (
          <GalleryRow key={img.id} image={img} />
        ))}
        {images.length === 0 && (
          <p className="text-gray-500 bg-white rounded-xl p-6 shadow">등록된 이미지가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
