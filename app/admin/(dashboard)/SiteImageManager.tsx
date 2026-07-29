'use client';

import { useEffect, useRef, useState } from 'react';
import { updateSiteImage } from '@/app/admin/actions';
import { useResizingFormAction } from '@/lib/admin/useResizingFormAction';
import {
  SITE_IMAGE_KEYS,
  SITE_IMAGE_LABEL,
  SITE_IMAGE_RECOMMENDED,
  siteImageSettingKey,
  type SiteImageKey,
  type SiteImages,
} from '@/lib/images';

function SiteImageRow({ imageKey, currentUrl }: { imageKey: SiteImageKey; currentUrl: string }) {
  const action = updateSiteImage.bind(null, siteImageSettingKey(imageKey));
  const { pending, onSubmit } = useResizingFormAction(action, { reset: true });
  const [dimensions, setDimensions] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function readDimensions(img: HTMLImageElement | null) {
    if (img && img.naturalWidth) setDimensions(`${img.naturalWidth} × ${img.naturalHeight}px`);
  }

  // 캐시된 이미지는 onLoad가 발생하지 않을 수 있으므로, 마운트/URL 변경 시 이미 로드됐으면 즉시 읽는다.
  useEffect(() => {
    setDimensions(null);
    const img = imgRef.current;
    if (img && img.complete) readDimensions(img);
  }, [currentUrl]);

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-6"
    >
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={currentUrl}
          alt={SITE_IMAGE_LABEL[imageKey]}
          onLoad={(e) => readDimensions(e.currentTarget)}
          className="w-40 h-28 object-contain rounded-lg border border-gray-200 bg-gray-50 shrink-0"
        />
      ) : (
        <div className="w-40 h-28 flex items-center justify-center text-xs text-gray-400 rounded-lg border border-gray-200 bg-gray-50 shrink-0">
          이미지 없음
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-1">{SITE_IMAGE_LABEL[imageKey]}</h3>
        <p className="text-[11px] text-gray-400 mb-1">{imageKey}</p>
        <p className="text-xs mb-3 flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-primary font-semibold">권장 {SITE_IMAGE_RECOMMENDED[imageKey]}px</span>
          <span className="text-gray-400">
            현재 {dimensions ?? '불러오는 중…'}
          </span>
        </p>
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
