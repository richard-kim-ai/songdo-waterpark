'use client';

import { useState } from 'react';

export default function FacilityLayout({
  masterUrl,
  cabanaUrl,
}: {
  masterUrl: string;
  cabanaUrl: string;
}) {
  const [tab, setTab] = useState<'total' | 'cabana'>('total');

  return (
    <section id="layout" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">시설 배치도</h2>
          <p className="text-lg text-gray-600">송도국제캠핑장 물놀이장 전체 안내</p>
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
              전체 배치도
            </button>
            <button
              onClick={() => setTab('cabana')}
              className={`flex-1 px-6 py-4 font-semibold transition-all whitespace-nowrap cursor-pointer ${
                tab === 'cabana'
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              카바나 배치도
            </button>
          </div>
          <div className="p-8">
            {tab === 'total' ? (
              <div className="relative bg-blue-50 rounded-lg overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={masterUrl}
                  alt="전체 배치도"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="relative bg-blue-50 rounded-lg overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cabanaUrl}
                  alt="카바나 배치도"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-6 left-6 bg-white rounded-lg shadow-lg px-6 py-3">
                  <span className="font-bold text-primary text-lg">A구역 (1-10번)</span>
                </div>
                <div className="absolute top-6 right-6 bg-white rounded-lg shadow-lg px-6 py-3">
                  <span className="font-bold text-primary text-lg">B구역 (11-20번)</span>
                </div>
                <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg px-6 py-3">
                  <span className="font-bold text-secondary text-lg">C구역 (21-30번)</span>
                </div>
                <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg px-6 py-3">
                  <span className="font-bold text-secondary text-lg">D구역 (31-40번)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
