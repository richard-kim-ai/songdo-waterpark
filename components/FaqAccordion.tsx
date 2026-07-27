'use client';

import { useRef, useState } from 'react';

// 아이콘/색상은 고정 메타데이터 — 항목별 제목과 내용(lines)은 관리자에서 편집 가능
const ICON_META = [
  { icon: 'ri-checkbox-circle-fill', color: 'text-primary' },
  { icon: 'ri-error-warning-fill', color: 'text-secondary' },
  { icon: 'ri-information-fill', color: 'text-primary' },
  { icon: 'ri-parking-box-fill', color: 'text-primary' },
  { icon: 'ri-home-heart-fill', color: 'text-primary' },
];

export type FaqItem = { title: string; lines: string[] };

export default function FaqAccordion({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: FaqItem[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 단일 오픈 아코디언은 다른 항목이 접히며 위쪽 높이가 줄어들어, 모바일에서 방금 누른
  // 항목이 화면 밖으로 튀어 "안 열린 것처럼" 보인다. 열 때 해당 항목을 헤더 아래(스크롤
  // 여백 scroll-mt)로 스크롤해 항상 같은 위치에서 열리도록 고정한다.
  const toggle = (i: number) => {
    setOpen((cur) => {
      const next = cur === i ? null : i;
      if (next === i) {
        requestAnimationFrame(() =>
          itemRefs.current[i]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        );
      }
      return next;
    });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>
        <div className="space-y-4">
          {items.map((item, i) => {
            const meta = ICON_META[i % ICON_META.length];
            return (
              <div
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="bg-white rounded-xl shadow-lg overflow-hidden scroll-mt-24"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-lg text-gray-900">{item.title}</span>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i
                      className={`ri-arrow-down-s-line text-2xl text-gray-600 transition-transform ${
                        open === i ? 'rotate-180' : ''
                      }`}
                    ></i>
                  </div>
                </button>
                {open === i && (
                  <div className="px-8 pb-6">
                    <ul className="space-y-3 text-gray-700">
                      {item.lines.map((line, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <i className={`${meta.icon} ${meta.color} mt-1`}></i>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
