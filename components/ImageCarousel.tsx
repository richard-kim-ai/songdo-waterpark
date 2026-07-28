'use client';

import { useState } from 'react';
import ZoomableImage from './ZoomableImage';

// 세로로 긴 배치도처럼 한 화면에 다 담기 어려운 이미지를 여러 장으로 나눠 넘겨 보는 캐러셀.
// 이미지가 1장뿐이면(관리자가 2번째 이미지를 아직 등록하지 않은 경우) 컨트롤 없이 그대로 보여준다.
export default function ImageCarousel({
  images,
  alt,
  className,
  imgClassName,
}: {
  /** 표시할 이미지 URL 목록. 빈 값은 자동으로 걸러진다. */
  images: string[];
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(0, slides.length - 1));

  if (slides.length === 0) return null;
  if (slides.length === 1) {
    return (
      <ZoomableImage src={slides[0]} alt={alt} className={className} imgClassName={imgClassName} />
    );
  }

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <div className="relative">
      <ZoomableImage
        key={current}
        src={slides[current]}
        alt={`${alt} (${current + 1}/${slides.length})`}
        className={className}
        imgClassName={imgClassName}
      />

      <button
        type="button"
        onClick={() => go(current - 1)}
        aria-label="이전 이미지"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/45 text-white rounded-full hover:bg-black/60 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-left-s-line text-2xl"></i>
      </button>
      <button
        type="button"
        onClick={() => go(current + 1)}
        aria-label="다음 이미지"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/45 text-white rounded-full hover:bg-black/60 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-right-s-line text-2xl"></i>
      </button>

      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번째 이미지 보기`}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              i === current ? 'w-6 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
