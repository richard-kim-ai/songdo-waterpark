'use client';

import { useState } from 'react';

const NAV_ITEMS = [
  { href: '#pricing', label: '입장안내' },
  { href: '#cabana', label: '카바나' },
  { href: '#facilities', label: '부속시설' },
  { href: '#info', label: '이용안내' },
  { href: '#gallery', label: '갤러리' },
];

export default function Header({ logoUrl }: { logoUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="송도국제캠핑장" className="h-16 w-auto" />
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
            className="w-6 h-6 flex items-center justify-center md:hidden cursor-pointer"
          >
            <i className={`${open ? 'ri-close-line' : 'ri-menu-line'} text-2xl text-gray-700`}></i>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-gray-700 hover:text-primary transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
