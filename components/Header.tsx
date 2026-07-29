'use client';

import { useState } from 'react';
import Link from 'next/link';

export type NavLabels = {
  pricing: string;
  cabana: string;
  facilities: string;
  info: string;
  gallery: string;
};

export default function Header({
  logoUrl,
  navLabels,
}: {
  logoUrl: string;
  navLabels: NavLabels;
}) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '#pricing', label: navLabels.pricing },
    { href: '#cabana', label: navLabels.cabana },
    { href: '#facilities', label: navLabels.facilities },
    { href: '#info', label: navLabels.info },
    { href: '#gallery', label: navLabels.gallery },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="송도국제캠핑장" className="h-11 md:h-16 w-auto cursor-pointer" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
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
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex flex-col">
            {navItems.map((item) => (
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
