-- 케노피(카바나) 실시간 예약 테이블 재정의
-- 기존 cabana_reservations(0001_init.sql, zone_id/customer_name/sunbed_count 스키마)는
-- 실제로 어떤 화면/기능에서도 사용된 적이 없어(0건) 새 예약 스키마로 교체합니다.
drop table if exists public.cabana_reservations;

create table public.cabana_reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_no text unique not null,
  reservation_date date not null,
  cabana_no int not null check (cabana_no between 1 and 60),
  time_type text not null check (time_type in ('주간', '야간', '종일')),
  name text not null,
  phone text not null,
  guest_count int not null default 1,
  is_camping boolean not null default false,
  has_admission boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_cabana_reservations_date_no on public.cabana_reservations(reservation_date, cabana_no);

-- inquiries 테이블과 동일한 패턴: RLS는 켜두되 정책은 만들지 않아
-- anon/authenticated 직접 접근을 전면 차단하고, 서비스롤(Server Action)로만 접근합니다.
alter table public.cabana_reservations enable row level security;
