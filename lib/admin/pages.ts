// 관리자 메뉴/권한 체계에서 공통으로 쓰는 페이지 목록.
// 서버(lib/admin/auth.ts)와 클라이언트(AdminSidebar, UserManager) 양쪽에서
// 안전하게 import할 수 있도록 서버 전용 의존성이 없는 순수 데이터 파일로 분리했습니다.
export const ADMIN_PAGES = [
  { key: 'popups', href: '/admin/popups', label: '팝업 생성 관리', icon: 'ri-megaphone-line' },
  { key: 'tickets', href: '/admin/tickets', label: '입장권 및 링크 관리', icon: 'ri-ticket-line' },
  {
    key: 'facilities',
    href: '/admin/facilities',
    label: '부속시설 관리',
    icon: 'ri-rollercoaster-line',
  },
  { key: 'cabana', href: '/admin/cabana', label: '케노피 판매 관리', icon: 'ri-home-heart-line' },
  {
    key: 'cabana-reservations',
    href: '/admin/cabana-reservations',
    label: '케노피 예약 관리',
    icon: 'ri-calendar-check-line',
  },
  {
    key: 'cabana-sales',
    href: '/admin/cabana-sales',
    label: '방문/매출 현황',
    icon: 'ri-line-chart-line',
  },
  {
    key: 'deposit',
    href: '/admin/deposit',
    label: '예약금 · 입금확인',
    icon: 'ri-bank-card-line',
  },
  { key: 'gallery', href: '/admin/gallery', label: '포토갤러리 관리', icon: 'ri-image-line' },
  {
    key: 'site-images',
    href: '/admin/site-images',
    label: '그외 이미지 관리',
    icon: 'ri-image-add-line',
  },
  { key: 'copy', href: '/admin/copy', label: '카피 수정', icon: 'ri-edit-2-line' },
  {
    key: 'inquiries',
    href: '/admin/inquiries',
    label: '고객 게시판',
    icon: 'ri-question-answer-line',
  },
  { key: 'usage', href: '/admin/usage', label: '사용량 & 트래픽', icon: 'ri-dashboard-line' },
  {
    key: 'kakao',
    href: '/admin/kakao',
    label: '카카오톡 알림 설정',
    icon: 'ri-kakao-talk-fill',
  },
  {
    key: 'aligo',
    href: '/admin/aligo',
    label: '고객 알림톡 설정',
    icon: 'ri-message-3-line',
  },
] as const;

export type AdminPageKey = (typeof ADMIN_PAGES)[number]['key'];
