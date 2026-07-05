-- ============================================================
-- 송도국제캠핑장 물놀이장 — 관리자 페이지 스키마
-- Supabase SQL Editor에 붙여넣고 실행하거나
-- `supabase db push` (Supabase CLI)로 적용하세요.
-- ============================================================

-- ---------- 관리자 화이트리스트 ----------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- 입장권: 구매 링크 / 이용시간 텍스트 컬럼 추가 ----------
alter table ticket_types add column if not exists purchase_url text;
alter table ticket_types add column if not exists usage_hours text;

-- ---------- 이용시간 안내 등 텍스트 콘텐츠 ----------
create table if not exists site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- 팝업 ----------
create table if not exists popups (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  image_path text,
  link_url text,
  is_active boolean not null default true,
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 포토 갤러리 ----------
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table admin_users enable row level security;
alter table site_settings enable row level security;
alter table popups enable row level security;
alter table gallery_images enable row level security;

-- admin_users: 본인 행만 조회 가능(로그인 사용자가 관리자인지 확인하는 용도).
-- insert/update/delete 정책은 만들지 않음 — 관리자 등록은 service_role(SQL Editor)에서만 수행.
create policy "본인 admin 여부 확인" on admin_users
  for select using (user_id = auth.uid());

-- ticket_types / cabana_zones: 기존 select-all 정책은 0001에서 이미 생성됨.
-- 관리자만 수정 가능하도록 update 정책 추가.
create policy "관리자만 입장권 수정 가능" on ticket_types
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 카바나 수정 가능" on cabana_zones
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- site_settings: 누구나 조회, 관리자만 수정/추가
create policy "누구나 사이트 설정 조회 가능" on site_settings
  for select using (true);

create policy "관리자만 사이트 설정 수정 가능" on site_settings
  for insert with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 사이트 설정 업데이트 가능" on site_settings
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

-- popups: 활성 팝업은 누구나 조회, 관리자는 전체 CRUD
create policy "누구나 활성 팝업 조회 가능" on popups
  for select using (is_active = true);

create policy "관리자는 팝업 전체 조회 가능" on popups
  for select using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 팝업 생성 가능" on popups
  for insert with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 팝업 수정 가능" on popups
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 팝업 삭제 가능" on popups
  for delete using (exists (select 1 from admin_users where user_id = auth.uid()));

-- gallery_images: 누구나 조회, 관리자만 CUD
create policy "누구나 갤러리 조회 가능" on gallery_images
  for select using (true);

create policy "관리자만 갤러리 생성 가능" on gallery_images
  for insert with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 갤러리 수정 가능" on gallery_images
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 갤러리 삭제 가능" on gallery_images
  for delete using (exists (select 1 from admin_users where user_id = auth.uid()));

-- ============================================================
-- Storage: site-images 버킷은 이미 존재(public, select는 이미 열려 있음).
-- 관리자만 업로드/수정/삭제 가능하도록 정책 추가.
-- ============================================================
create policy "관리자만 site-images 업로드 가능" on storage.objects
  for insert with check (
    bucket_id = 'site-images'
    and exists (select 1 from admin_users where user_id = auth.uid())
  );

create policy "관리자만 site-images 수정 가능" on storage.objects
  for update using (
    bucket_id = 'site-images'
    and exists (select 1 from admin_users where user_id = auth.uid())
  );

create policy "관리자만 site-images 삭제 가능" on storage.objects
  for delete using (
    bucket_id = 'site-images'
    and exists (select 1 from admin_users where user_id = auth.uid())
  );

-- ============================================================
-- 초기 데이터
-- ============================================================
insert into site_settings (key, value) values
  ('pool_season', '6월 ~ 8월 (하계)'),
  ('pool_weekday_hours', '10:00 ~ 18:00'),
  ('pool_weekend_hours', '09:00 ~ 19:00'),
  ('pool_last_entry', '마감 1시간 전'),
  ('cabana_open_hours', '10:00 ~ 18:00'),
  ('cabana_usage_unit', '30분 단위'),
  ('cabana_notice', '카바나는 일별 사용권으로 판매됩니다
썬배드는 카바나 예약 시 추가로 선택 가능합니다
주말 요금은 금요일, 토요일, 일요일 및 공휴일에 적용됩니다')
on conflict (key) do nothing;

update ticket_types set usage_hours = '10:00 ~ 17:30' where name = '신나는기차';
update ticket_types set usage_hours = '10:00 ~ 17:30' where name = '마이카';

insert into gallery_images (label, image_path, sort_order) values
  ('물놀이장 전경', 'gallery-1.jpg', 1),
  ('발물놀이터', 'gallery-2.jpg', 2),
  ('카바나 내부', 'gallery-3.jpg', 3),
  ('카바나 외부', 'gallery-4.jpg', 4),
  ('신나는기차', 'gallery-5.jpg', 5),
  ('캠핑장 전경', 'gallery-6.jpg', 6)
on conflict do nothing;

-- ============================================================
-- 관리자 계정 등록 안내 (1회 수동 작업)
-- ============================================================
-- 1) Supabase Dashboard > Authentication > Users > Add user 로 관리자 계정(이메일/비밀번호) 생성
-- 2) 생성된 사용자의 UID를 복사한 뒤 아래 SQL을 SQL Editor에서 실행:
--
--    insert into admin_users (user_id) values ('<복사한 UID>');
--
-- 이 작업은 service_role 권한(SQL Editor/Dashboard)에서만 가능하며,
-- 익명/일반 로그인 사용자는 admin_users에 직접 등록할 수 없습니다.
