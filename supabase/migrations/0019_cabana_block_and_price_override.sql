-- 케노피 예약 관리 화면 개선:
-- 1) is_blocked: 관리자가 실제 고객 예약 없이 특정 케노피·타임을 "예약막기"로
--    비워두지 못하게 잠글 때 사용 (매출 통계에서는 제외됨)
-- 2) price_override: 결제금액을 자동 계산값 대신 직접 입력해야 할 때 사용
alter table public.cabana_reservations
  add column if not exists is_blocked boolean not null default false;

alter table public.cabana_reservations
  add column if not exists price_override integer;
