-- ============================================================
-- 송도국제캠핑장 물놀이장 — 입장권/부속시설 항목 노출여부(is_active) 관리
-- 관리자 페이지에서 체크박스로 개별 항목을 홈페이지에 노출할지 결정할 수
-- 있도록 ticket_types에 is_active 컬럼을 추가합니다. (기본값 true이므로
-- 기존 데이터는 변경 없이 계속 노출됩니다.)
-- ============================================================

alter table ticket_types
  add column if not exists is_active boolean not null default true;
