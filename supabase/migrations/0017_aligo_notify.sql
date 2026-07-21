-- 알리고(Aligo) 카카오 알림톡 + 문자 대체발송 연동 설정 저장용 테이블
-- (케노피 예약 접수 시 고객 본인 휴대폰으로 예약 확인 알림 발송)
-- API 키 등 민감정보를 담으므로, site_settings(공개 조회 정책 있음)에는 넣지 않고
-- kakao_notify_settings와 동일하게 별도 테이블로 분리, RLS는 켜두되 정책 없이
-- 서비스롤(Server Action) 전용으로 접근합니다.
create table public.aligo_notify_settings (
  id int primary key default 1,
  api_key text,
  user_id text,
  sender text,
  sender_key text,
  tpl_code text,
  message_template text,
  use_sms_fallback boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint aligo_notify_settings_singleton check (id = 1)
);

alter table public.aligo_notify_settings enable row level security;
