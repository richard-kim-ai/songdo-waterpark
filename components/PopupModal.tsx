'use client';

import { useEffect, useState } from 'react';
import { publicUrl } from '@/lib/images';
import type { Database } from '@/types/database';

type Popup = Database['public']['Tables']['popups']['Row'];

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

function hidePopupUntilMidnight(id: string) {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  document.cookie = `hide_popup_${id}=1; expires=${midnight.toUTCString()}; path=/`;
}

export default function PopupModal({ popups }: { popups: Popup[] }) {
  const [queue, setQueue] = useState<Popup[]>([]);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const visible = popups.filter((p) => !getCookie(`hide_popup_${p.id}`));
    setQueue(visible);
  }, [popups]);

  if (queue.length === 0) return null;

  const current = queue[0];

  function handleClose() {
    if (dontShowToday) {
      hidePopupUntilMidnight(current.id);
    }
    setDontShowToday(false);
    setQueue((q) => q.slice(1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="relative">
          {current.image_path &&
            (current.link_url ? (
              <a href={current.link_url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicUrl(current.image_path)}
                  alt={current.title}
                  className="w-full max-h-[420px] object-cover"
                />
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicUrl(current.image_path)}
                alt={current.title}
                className="w-full max-h-[420px] object-cover"
              />
            ))}
          <button
            onClick={handleClose}
            aria-label="닫기"
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow hover:bg-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        {current.title && (
          <div className="px-6 py-4">
            <p className="font-semibold text-gray-900">{current.title}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            오늘 하루 보지 않기
          </label>
          <button
            onClick={handleClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
