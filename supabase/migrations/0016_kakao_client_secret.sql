-- 카카오 디벨로퍼스 앱에서 "Client Secret 사용함"이 켜져 있으면 OAuth 토큰 발급/갱신 시
-- client_secret이 없으면 "Bad client credentials" 오류가 발생하므로 저장 컬럼 추가.
alter table public.kakao_notify_settings
  add column if not exists client_secret text;
