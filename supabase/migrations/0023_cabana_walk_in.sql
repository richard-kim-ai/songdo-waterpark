-- 현장배정(워크인): 예약 없이 방문한 고객을 이름 입력 없이 일일 순번으로 접수해
-- 매출에 반영하기 위한 구분 컬럼. 현장배정 건은 등록 즉시 방문 완료(is_visited)로 처리된다.
alter table public.cabana_reservations
  add column if not exists is_walk_in boolean not null default false;
