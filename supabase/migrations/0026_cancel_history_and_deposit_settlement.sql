-- 1) 예약 취소 이력 보존
--    기존에는 취소 시 행을 삭제해 기록이 남지 않았다. 소프트 삭제로 바꿔
--    예약 리스트에 취소 건도 남기고, 잔여 계산에서는 제외한다.
alter table public.cabana_reservations
  add column if not exists is_cancelled boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  -- 'customer' | 'admin' | 'deposit_unpaid'(입금 미확인으로 자리 반환)
  add column if not exists cancelled_by text not null default '';

-- 2) 예약금 정산
--    is_full_payment : 예약금으로 이용요금 전액을 미리 받은 건
--    deposit_refunded_at : 방문 후 현장 카드결제로 예약금을 환불한 시각
alter table public.cabana_reservations
  add column if not exists is_full_payment boolean not null default false,
  add column if not exists deposit_refunded_at timestamptz;

-- deposit_status에 'forfeited'(몰수) 추가.
--   노쇼 / 당일 취소는 예약금을 돌려주지 않으므로 몰수 처리하고 매출로 잡는다.
alter table public.cabana_reservations
  drop constraint if exists cabana_reservations_deposit_status_check;
alter table public.cabana_reservations
  add constraint cabana_reservations_deposit_status_check
  check (deposit_status in ('none', 'pending', 'paid', 'refunded', 'forfeited'));

-- 잔여 계산은 취소되지 않은 예약만 본다.
create index if not exists cabana_reservations_active_idx
  on public.cabana_reservations (reservation_date, zone_type)
  where is_cancelled = false;
