'use client';

import { useState } from 'react';
import ImageCarousel from './ImageCarousel';

export default function FacilityLayout({
  masterUrl,
  cabanaUrl,
  cabanaUrl2,
  sectionTitle,
  sectionSubtitle,
  tabTotalLabel,
  tabCabanaLabel,
}: {
  masterUrl: string;
  cabanaUrl: string;
  /** 평상&케노피 배치도 2번째 이미지(선택). 등록되면 캐러셀로 넘겨볼 수 있다. */
  cabanaUrl2: string;
  sectionTitle: string;
  sectionSubtitle: string;
  tabTotalLabel: string;
  tabCabanaLabel: string;
}) {
  const [tab, setTab] = useState<'total' | 'cabana'>('total');

  const activeImages = tab === 'total' ? [masterUrl] : [cabanaUrl, cabanaUrl2];
  const activeAlt = tab === 'total' ? tabTotalLabel : tabCabanaLabel;

  return (
    <section id="layout" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          <p className="text-lg text-gray-600">{sectionSubtitle}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setTab('total')}
              className={`flex-1 px-6 py-4 font-semibold transition-all whitespace-nowrap cursor-pointer ${
                tab === 'total'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              {tabTotalLabel}
            </button>
            <button
              onClick={() => setTab('cabana')}
              className={`flex-1 px-6 py-4 font-semibold transition-all whitespace-nowrap cursor-pointer ${
                tab === 'cabana'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              {tabCabanaLabel}
            </button>
          </div>
          <div className="p-8">
            <ImageCarousel
              key={tab}
              images={activeImages}
              alt={activeAlt}
              className="bg-white rounded-lg overflow-hidden aspect-[1500/400] border border-gray-100"
              imgClassName="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
