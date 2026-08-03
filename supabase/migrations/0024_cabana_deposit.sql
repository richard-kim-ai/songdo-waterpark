-- 자리 지정 예약의 노쇼 방지 예약금(보증금) 관리
--
-- deposit_status
--   'none'    예약금 대상이 아님 (자동 배정 / 현장배정 / 예약막기)
--   'pending' 입금 대기 — 안내한 계좌로 아직 입금이 확인되지 않음
--   'paid'    입금 확인 완료 — 예약 확정
--   'refunded' 환불 처리 (취소 등)
alter table public.cabana_reservations
  add column if not exists deposit_status text not null default 'none',
  add column if not exists deposit_amount integer not null default 0,
  add column if not exists depositor_name text not null default '',
  add column if not exists deposit_paid_at timestamptz,
  -- 오픈뱅킹 자동 매칭 시 어떤 거래로 확인됐는지 추적용(중복 매칭 방지)
  add column if not exists deposit_tx_ref text;

alter table public.cabana_reservations
  drop constraint if exists cabana_reservations_deposit_status_check;
alter table public.cabana_reservations
  add constraint cabana_reservations_deposit_status_check
  check (deposit_status in ('none', 'pending', 'paid', 'refunded'));

-- 입금 대기 건 조회 / 자동 매칭 조회에 사용
create index if not exists cabana_reservations_deposit_status_idx
  on public.cabana_reservations (deposit_status, reservation_date);

-- 같은 입금 거래가 두 예약에 매칭되지 않도록
create unique index if not exists cabana_reservations_deposit_tx_ref_idx
  on public.cabana_reservations (deposit_tx_ref)
  where deposit_tx_ref is not null;

-- 텔레그램 / 오픈뱅킹 연동 설정 (단일 행)
create table if not exists public.deposit_settings (
  id integer primary key default 1,
  -- 텔레그램 봇 알림
  telegram_bot_token text not null default '',
  telegram_chat_id text not null default '',
  -- 오픈뱅킹(금융결제원) 거래내역 조회. 발급 전에는 비어 있고, 그동안은 수동 확인으로 운영.
  openbanking_access_token text not null default '',
  openbanking_fintech_use_num text not null default '',
  openbanking_client_use_code text not null default '',
  openbanking_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint deposit_settings_single_row check (id = 1)
);

-- 오픈뱅킹 OAuth 연동값. 이용기관 등록 후 발급받는 값들로,
-- 관리자 화면에서 "오픈뱅킹 연결하기"를 누르면 authorize → callback → token 순으로 채워진다.
alter table public.deposit_settings
  add column if not exists openbanking_client_id text not null default '',
  add column if not exists openbanking_client_secret text not null default '',
  add column if not exists openbanking_redirect_uri text not null default '',
  add column if not exists openbanking_refresh_token text not null default '',
  add column if not exists openbanking_user_seq_no text not null default '',
  add column if not exists openbanking_token_expires_at timestamptz;

insert into public.deposit_settings (id) values (1) on conflict (id) do nothing;

alter table public.deposit_settings enable row level security;

-- 서비스 롤(서버 액션)만 접근. 공개 클라이언트에는 정책을 열지 않는다.
drop policy if exists "deposit_settings admin all" on public.deposit_settings;
create policy "deposit_settings admin all" on public.deposit_settings
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
