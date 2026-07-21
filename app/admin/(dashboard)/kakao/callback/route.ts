import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { exchangeKakaoCode } from '@/lib/kakao';

export async function GET(request: NextRequest) {
  await requireAdmin();

  const code = request.nextUrl.searchParams.get('code');
  const kakaoError = request.nextUrl.searchParams.get('error');
  const redirectTo = new URL('/admin/kakao', request.url);

  if (kakaoError) {
    redirectTo.searchParams.set('kakao_error', '카카오 인증이 취소되었습니다.');
    return NextResponse.redirect(redirectTo);
  }

  if (!code) {
    redirectTo.searchParams.set('kakao_error', '인증 코드가 없습니다.');
    return NextResponse.redirect(redirectTo);
  }

  const result = await exchangeKakaoCode(code);
  if (!result.ok) {
    redirectTo.searchParams.set('kakao_error', result.error);
  } else {
    redirectTo.searchParams.set('kakao_connected', '1');
  }

  return NextResponse.redirect(redirectTo);
}
