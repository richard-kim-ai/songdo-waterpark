-- 케노피 예약 구분(일반/단체/장애인·유공자)별 할인 적용을 위한 컬럼
alter table public.cabana_reservations
  add column if not exists discount_type text not null default '일반'
  check (discount_type in ('일반', '단체', '장애인/유공자'));
