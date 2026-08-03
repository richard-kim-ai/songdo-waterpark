import { redirect } from 'next/navigation';

// 알림 연동은 /admin/notify 한 화면으로 통합됐다. 기존 주소·북마크는 그쪽으로 넘긴다.
export default function AligoAdminPage() {
  redirect('/admin/notify');
}
