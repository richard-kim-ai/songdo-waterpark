-- ============================================================
-- 송도국제캠핑장 물놀이장 — 초기 스키마
-- Supabase SQL Editor에 붙여넣고 실행하거나
-- `supabase db push` (Supabase CLI)로 적용하세요.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 입장권 종류 ----------
create table if not exists ticket_types (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('general', 'family_package', 'attraction')),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 카바나 구역 ----------
create table if not exists cabana_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer not null,
  unit_count integer not null,
  weekday_price integer not null check (weekday_price >= 0),
  weekend_price integer not null check (weekend_price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 입장권 주문 ----------
create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references ticket_types(id),
  visit_date date not null,
  quantity integer not null check (quantity > 0),
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------- 카바나 예약 ----------
create table if not exists cabana_reservations (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references cabana_zones(id),
  reservation_date date not null,
  customer_name text not null,
  customer_phone text not null,
  sunbed_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_orders_visit_date on ticket_orders(visit_date);
create index if not exists idx_cabana_reservations_date on cabana_reservations(reservation_date, zone_id);

-- ============================================================
-- RLS (Row Level Security)
-- 요금표는 누구나 읽기 가능, 예약/주문 생성은 서버(service_role)에서만 처리 권장
-- ============================================================
alter table ticket_types enable row level security;
alter table cabana_zones enable row level security;
alter table ticket_orders enable row level security;
alter table cabana_reservations enable row level security;

create policy "누구나 요금표 조회 가능" on ticket_types
  for select using (true);

create policy "누구나 카바나 구역 조회 가능" on cabana_zones
  for select using (true);

-- 주문/예약 테이블은 기본적으로 RLS만 켜두고 정책은 만들지 않습니다.
-- => anon 키로는 select/insert 모두 차단되며, 서버 라우트(Server Action)에서
--    service_role 클라이언트(lib/supabase/admin.ts)로만 쓰기 작업을 수행합니다.
-- 만약 클라이언트에서 직접 조회가 필요하면 아래처럼 본인 예약만 보이도록
-- 정책을 추가할 수 있습니다 (전화번호 인증 등 별도 로직 필요):
--
-- create policy "본인 예약만 조회" on cabana_reservations
--   for select using (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- ============================================================
-- 초기 데이터 (참조 사이트 기준)
-- ============================================================
insert into ticket_types (category, name, description, price, sort_order) values
  ('general', '일반 성인', '만 19세 이상', 7000, 1),
  ('general', '일반 어린이', '만 18세 이하', 4000, 2),
  ('general', '국가유공자 및 장애인', '특별 할인 50%', 3500, 3),
  ('family_package', '3인 가족 패키지', '발물놀이터 입장권 3매 + 신나는기차 + 마이카', 16000, 4),
  ('family_package', '4인 가족 패키지', '발물놀이터 입장권 4매 + 신나는기차 + 마이카', 18000, 5),
  ('attraction', '신나는기차', '30분 이용권', 4000, 6),
  ('attraction', '마이카', '30분 이용권', 4000, 7),
  ('attraction', '빅2 패키지', '신나는기차 + 마이카 이용권', 6000, 8)
on conflict do nothing;

insert into cabana_zones (name, capacity, unit_count, weekday_price, weekend_price, sort_order) values
  ('A타입 (4인)', 4, 20, 40000, 50000, 1),
  ('B타입 (3인)', 3, 20, 30000, 40000, 2),
  ('C타입 (2인)', 2, 10, 10000, 20000, 3),
  ('썬배드 구역', 1, 50, 5000, 5000, 4)
on conflict do nothing;
