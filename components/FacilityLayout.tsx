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
            {tab === 'total' ? (
              <div className="relative bg-blue-50 rounded-lg overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={masterUrl}
                  alt={tabTotalLabel}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="relative bg-blue-50 rounded-lg overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cabanaUrl}
                  alt={tabCabanaLabel}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
