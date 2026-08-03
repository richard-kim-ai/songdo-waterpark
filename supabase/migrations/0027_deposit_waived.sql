-- 입금을 받지 않고 관리자가 바로 확정하는 경우(단골·현장 협의 등)를 위한 'waived' 상태.
--   waived = 예약금 면제. 예약은 확정되지만 받은 돈은 없으므로 매출에 잡히지 않는다.
alter table public.cabana_reservations
  drop constraint if exists cabana_reservations_deposit_status_check;
alter table public.cabana_reservations
  add constraint cabana_reservations_deposit_status_check
  check (deposit_status in ('none', 'pending', 'paid', 'refunded', 'forfeited', 'waived'));
