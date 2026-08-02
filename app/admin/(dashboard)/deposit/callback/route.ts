import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { exchangeOpenbankingCode } from '@/lib/openbanking';

// 오픈뱅킹 개발자센터에 등록하는 Callback URL(Redirect URL)이 이 경로입니다.
//   https://<도메인>/admin/deposit/callback
// 사용자인증을 마치면 여기로 code가 붙어 돌아오고, 그 code를 토큰으로 교환해 저장합니다.
export async function GET(request: NextRequest) {
  await requireAdmin();

  const code = request.nextUrl.searchParams.get('code');
  const bankError = request.nextUrl.searchParams.get('error');
  const redirectTo = new URL('/admin/deposit', request.url);

  if (bankError) {
    redirectTo.searchParams.set('ob_error', '오픈뱅킹 인증이 취소되었습니다.');
    return NextResponse.redirect(redirectTo);
  }
  if (!code) {
    redirectTo.searchParams.set('ob_error', '인증 코드가 없습니다.');
    return NextResponse.redirect(redirectTo);
  }

  const result = await exchangeOpenbankingCode(code);
  if (!result.ok) {
    redirectTo.searchParams.set('ob_error', result.error);
  } else {
    redirectTo.searchParams.set('ob_connected', '1');
  }
  return NextResponse.redirect(redirectTo);
}
