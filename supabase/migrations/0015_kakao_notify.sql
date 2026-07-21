-- 카카오톡 "나에게 보내기" 알림 연동 설정 저장용 테이블 (예약 접수 시 관리자에게 알림)
-- REST API 키·OAuth 토큰 등 민감정보를 담으므로, site_settings(공개 조회 정책 있음)에는
-- 절대 넣지 않고 별도 테이블로 분리합니다.
-- inquiries/cabana_reservations와 동일한 패턴: RLS는 켜두되 정책은 만들지 않아
-- anon/authenticated 직접 접근을 전면 차단하고, 서비스롤(Server Action)로만 접근합니다.
create table public.kakao_notify_settings (
  id int primary key default 1,
  rest_api_key text,
  redirect_uri text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint kakao_notify_settings_singleton check (id = 1)
);

alter table public.kakao_notify_settings enable row level security;
