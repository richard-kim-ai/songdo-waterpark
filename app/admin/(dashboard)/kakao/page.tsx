import { redirect } from 'next/navigation';

// 알림 연동은 /admin/notify 한 화면으로 통합됐다. 기존 주소·북마크는 그쪽으로 넘긴다.
export default async function KakaoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kakao_connected?: string; kakao_error?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.kakao_connected) query.set('kakao_connected', params.kakao_connected);
  if (params.kakao_error) query.set('kakao_error', params.kakao_error);
  const suffix = query.toString();
  redirect(`/admin/notify${suffix ? `?${suffix}` : ''}`);
}
