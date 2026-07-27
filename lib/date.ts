// 서버(UTC)에서 new Date().toISOString()을 쓰면 한국 새벽 시간대(00~09시 KST)에
// 전날 날짜가 나와 "오늘" 화면이 하루 밀리는 문제가 있어, 항상 한국(Asia/Seoul)
// 기준의 오늘 날짜(YYYY-MM-DD)를 반환한다. en-CA 로케일은 YYYY-MM-DD 형식으로 포맷됨.
export function todaySeoul(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}
