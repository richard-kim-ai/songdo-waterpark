-- 노쇼(미방문) 처리: 예약을 노쇼로 표시하면 판매 현황(매출/건수) 집계에서 제외된다.
-- 슬롯은 그대로 예약된 것으로 남고, 대시보드에서만 매출이 빠진다.
alter table public.cabana_reservations
  add column if not exists is_no_show boolean not null default false;
