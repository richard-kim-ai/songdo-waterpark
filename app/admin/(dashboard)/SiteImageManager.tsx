'use client';

import { updateSiteImage } from '@/app/admin/actions';
import {
  SITE_IMAGE_KEYS,
  SITE_IMAGE_LABEL,
  siteImageSettingKey,
  type SiteImages,
} from '@/lib/images';

export default function SiteImageManager({ siteImages }: { siteImages: SiteImages }) {
  return (
    <div className="space-y-4">
      {SITE_IMAGE_KEYS.map((key) => {
        const action = updateSiteImage.bind(null, siteImageSettingKey(key));
        return (
          <form
            key={key}
            action={action}
            className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center gap-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteImages[key]}
              alt={SITE_IMAGE_LABEL[key]}
              className="w-40 h-28 object-contain rounded-lg border border-gray-200 bg-gray-50 shrink-0"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{SITE_IMAGE_LABEL[key]}</h3>
              <p className="text-xs text-gray-400 mb-3">{key}</p>
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
              className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer shrink-0"
            >
              교체하기
            </button>
          </form>
        );
      })}
    </div>
  );
}
