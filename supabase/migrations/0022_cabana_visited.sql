-- 방문 확인(체크인): 예약자가 실제 방문하면 방문 완료로 표시한다.
-- 방문 완료 예약의 매출만 '확정 매출'로 집계된다. 노쇼(is_no_show)와는 상호 배타적으로 운용.
alter table public.cabana_reservations
  add column if not exists is_visited boolean not null default false;
