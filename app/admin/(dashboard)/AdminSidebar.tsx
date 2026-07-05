'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAdmin } from '@/app/admin/actions';

const MENU = [
  { href: '/admin/popups', icon: 'ri-megaphone-line', label: '팝업 생성 관리' },
  { href: '/admin/tickets', icon: 'ri-ticket-line', label: '입장권 및 링크 관리' },
  { href: '/admin/facilities', icon: 'ri-rollercoaster-line', label: '부속시설 & 패키지' },
  { href: '/admin/cabana', icon: 'ri-home-heart-line', label: '카바나 금액 수정' },
  { href: '/admin/hours', icon: 'ri-time-line', label: '이용시간 텍스트' },
  { href: '/admin/gallery', icon: 'ri-image-line', label: '포토갤러리 관리' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <p className="font-pacifico text-2xl text-primary">logo</p>
        <p className="text-sm text-gray-400 mt-1">물놀이장 관리자</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {MENU.map((item) => {
          const active = pathname?.startsWith(item.href);
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
  );
}
