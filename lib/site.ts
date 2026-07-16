// 사이트 전역 SEO 설정 — 커스텀 도메인 연결 시 NEXT_PUBLIC_SITE_URL 환경변수로 덮어씀.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://songdo-waterpark.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = '송도국제캠핑장 물놀이장';

export const SITE_TITLE = '송도국제캠핑장 물놀이장 | 인천 송도 수영장·발물놀이터·케노피 예약';

export const SITE_DESCRIPTION =
  '인천 송도국제캠핑장 물놀이장 공식 홈페이지. 시원한 수영장과 발물놀이터, 취사 가능한 케노피(평상)에서 가족과 함께 특별한 여름을 보내세요. 입장권·케노피 예약, 이용시간, 요금, 오시는 길 안내.';

// 검색 노출을 높이기 위한 핵심 키워드
export const SITE_KEYWORDS = [
  '송도 물놀이장',
  '인천 물놀이장',
  '송도국제캠핑장',
  '송도 수영장',
  '인천 수영장',
  '발물놀이터',
  '송도 케노피',
  '송도 캠핑장 물놀이',
  '인천 여름 물놀이',
  '가족 물놀이장',
];
