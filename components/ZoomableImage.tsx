'use client';

import { useState } from 'react';

// 이미지를 탭/클릭하면 전체화면 라이트박스로 확대. 라이트박스에서 다시 탭하면
// '실제 크기'로 전환되어(스크롤 가능) 모바일에서도 배치도·안내문의 작은 글씨를 볼 수 있다.
export default function ZoomableImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  /** 인라인 썸네일 래퍼(버튼)에 적용할 클래스 (비율/배경 등) */
  className?: string;
  /** 인라인 썸네일 이미지에 적용할 클래스 */
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [actualSize, setActualSize] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActualSize(false);
          setOpen(true);
        }}
        aria-label={`${alt} 확대 보기`}
        className={`relative block w-full cursor-zoom-in group ${className ?? ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={imgClassName ?? 'w-full h-auto'} />
        {/* 모바일에는 hover가 없으므로 확대 아이콘을 항상 표시, 데스크톱은 hover 시 표시 */}
        <span className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center bg-black/45 text-white rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <i className="ri-zoom-in-line text-lg"></i>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 overflow-auto overscroll-contain"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            aria-label="닫기"
            className="fixed top-4 right-4 z-10 w-11 h-11 flex items-center justify-center bg-white/90 rounded-full shadow hover:bg-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActualSize((v) => !v);
            }}
            className="fixed top-4 left-4 z-10 px-4 py-2 flex items-center gap-1 bg-white/90 rounded-full shadow text-sm font-semibold text-gray-800 hover:bg-white transition-colors cursor-pointer"
          >
            <i className={actualSize ? 'ri-fullscreen-exit-line' : 'ri-zoom-in-line'}></i>
            {actualSize ? '화면 맞춤' : '실제 크기'}
          </button>

          {actualSize ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              onClick={(e) => {
                e.stopPropagation();
                setActualSize(false);
              }}
              className="max-w-none w-auto h-auto block mx-auto my-16 cursor-zoom-out"
            />
          ) : (
            <div className="min-h-full flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onClick={(e) => {
                  e.stopPropagation();
                  setActualSize(true);
                }}
                className="max-w-full max-h-[92vh] object-contain cursor-zoom-in"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
