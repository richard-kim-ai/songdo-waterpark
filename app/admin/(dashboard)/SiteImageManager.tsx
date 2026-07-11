'use client';

import { updateSiteImage } from '@/app/admin/actions';
import { useResizingFormAction } from '@/lib/admin/useResizingFormAction';
import {
  SITE_IMAGE_KEYS,
  SITE_IMAGE_LABEL,
  siteImageSettingKey,
  type SiteImageKey,
  type SiteImages,
} from '@/lib/images';

function SiteImageRow({ imageKey, currentUrl }: { imageKey: SiteImageKey; currentUrl: string }) {
  const action = updateSiteImage.bind(null, siteImageSettingKey(imageKey));
  const { pending, onSubmit } = useResizingFormAction(action, { reset: true });

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center gap-6"
    >
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={SITE_IMAGE_LABEL[imageKey]}
          className="w-40 h-28 object-contain rounded-lg border border-gray-200 bg-gray-50 shrink-0"
        />
      ) : (
        <div className="w-40 h-28 flex items-center justify-center text-xs text-gray-400 rounded-lg border border-gray-200 bg-gray-50 shrink-0">
          이미지 없음
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-1">{SITE_IMAGE_LABEL[imageKey]}</h3>
        <p className="text-xs text-gray-400 mb-3">{imageKey}</p>
        <input
          type="file"
          name="image"
          accept="image/*"
          required
          className="block text-sm text-gray-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer shrink-0"
      >
        {pending ? '업로드 중...' : '교체하기'}
      </button>
    </form>
  );
}

export default function SiteImageManager({ siteImages }: { siteImages: SiteImages }) {
  return (
    <div className="space-y-4">
      {SITE_IMAGE_KEYS.map((key) => (
        <SiteImageRow key={key} imageKey={key} currentUrl={siteImages[key]} />
      ))}
    </div>
  );
}
