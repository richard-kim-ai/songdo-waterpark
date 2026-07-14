'use client';

import { useState } from 'react';

export default function FacilityLayout({
  masterUrl,
  cabanaUrl,
  sectionTitle,
  sectionSubtitle,
  tabTotalLabel,
  tabCabanaLabel,
}: {
  masterUrl: string;
  cabanaUrl: string;
  sectionTitle: string;
  sectionSubtitle: string;
  tabTotalLabel: string;
  tabCabanaLabel: string;
}) {
  const [tab, setTab] = useState<'total' | 'cabana'>('total');
  const [zoomed, setZoomed] = useState<{ url: string; alt: string } | null>(null);

  const activeUrl = tab === 'total' ? masterUrl : cabanaUrl;
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
            <button
              type="button"
              onClick={() => setZoomed({ url: activeUrl, alt: activeAlt })}
              className="relative w-full bg-white rounded-lg overflow-hidden aspect-[1500/400] border border-gray-100 cursor-zoom-in group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeUrl}
                alt={activeAlt}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="ri-zoom-in-line text-xl text-gray-700"></i>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 cursor-zoom-out"
          onClick={() => setZoomed(null)}
        >
          <button
            type="button"
            onClick={() => setZoomed(null)}
            aria-label="닫기"
            className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center bg-white/90 rounded-full shadow hover:bg-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomed.url}
            alt={zoomed.alt}
            className="max-w-full max-h-full object-contain rounded-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
