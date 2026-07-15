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

// 나란히 노출 가능 여부는 md(768px) 이상에서만 적용 — 모바일은 항상 순차 노출.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

function PopupCard({
  popup,
  onClose,
  compact,
}: {
  popup: Popup;
  onClose: (dontShowToday: boolean) => void;
  compact?: boolean;
}) {
  const [dontShowToday, setDontShowToday] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl shadow-2xl overflow-hidden ${
        compact ? 'w-[22rem]' : 'w-full max-w-md'
      }`}
    >
      <div className="relative">
        {popup.image_path &&
          (popup.link_url ? (
            <a href={popup.link_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(popup.image_path)}
                alt={popup.title}
                className="w-full max-h-[420px] object-cover"
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={publicUrl(popup.image_path)}
              alt={popup.title}
              className="w-full max-h-[420px] object-cover"
            />
          ))}
        <button
          onClick={() => onClose(dontShowToday)}
          aria-label="닫기"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow hover:bg-white transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>
      {popup.title && (
        <div className="px-6 py-4">
          <p className="font-semibold text-gray-900">{popup.title}</p>
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
          onClick={() => onClose(dontShowToday)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function PopupModal({ popups }: { popups: Popup[] }) {
  const [queue, setQueue] = useState<Popup[]>([]);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const visible = popups.filter((p) => !getCookie(`hide_popup_${p.id}`));
    setQueue(visible);
  }, [popups]);

  if (queue.length === 0) return null;

  function handleClose(id: string, dontShowToday: boolean) {
    if (dontShowToday) {
      hidePopupUntilMidnight(id);
    }
    setQueue((q) => q.filter((p) => p.id !== id));
  }

  // 데스크톱에서 앞의 두 팝업이 모두 "동시 노출" 설정이면 나란히, 아니면 하나씩 순차 노출.
  const showTogether = isDesktop && queue.length >= 2 && queue[0].show_together && queue[1].show_together;
  const visiblePopups = showTogether ? [queue[0], queue[1]] : [queue[0]];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={showTogether ? 'flex flex-row flex-nowrap justify-start gap-6' : ''}>
        {visiblePopups.map((popup) => (
          <PopupCard
            key={popup.id}
            popup={popup}
            compact={showTogether}
            onClose={(dontShowToday) => handleClose(popup.id, dontShowToday)}
          />
        ))}
      </div>
    </div>
  );
}
