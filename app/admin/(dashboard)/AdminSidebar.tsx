'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAdmin } from '@/app/admin/actions';
import { ADMIN_PAGES } from '@/lib/admin/pages';

export default function AdminSidebar({
  logoUrl,
  isSuperAdmin,
  permissions,
}: {
  logoUrl: string;
  isSuperAdmin: boolean;
  permissions: string[];
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 페이지 이동 시 모바일 드로어 자동 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const visiblePages = isSuperAdmin
    ? ADMIN_PAGES
    : ADMIN_PAGES.filter((p) => permissions.includes(p.key));

  const menu: { href: string; icon: string; label: string }[] = [...visiblePages];
  if (isSuperAdmin) {
    menu.push({ href: '/admin/users', icon: 'ri-user-settings-line', label: '사용자 관리' });
  }

  return (
    <>
      {/* 모바일 상단바 */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-gray-900 text-white fixed top-0 inset-x-0 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="메뉴 열기"
          className="p-2 -ml-2 cursor-pointer"
        >
          <i className="ri-menu-line text-2xl"></i>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="송도국제캠핑장" className="h-8 w-auto" />
        <div className="w-8" />
      </div>

      {/* 모바일 드로어 배경 오버레이 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`w-64 bg-gray-900 text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="송도국제캠핑장" className="h-14 w-auto" />
            <p className="text-sm text-gray-400 mt-1">물놀이장 관리자</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="메뉴 닫기"
            className="md:hidden p-2 -mr-2 text-gray-300 cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors text-sm"
          >
            <i className="ri-external-link-line text-lg"></i>
            홈페이지 보기
          </Link>
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors text-sm cursor-pointer"
            >
              <i className="ri-logout-box-line text-lg"></i>
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
