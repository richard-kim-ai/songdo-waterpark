-- ============================================================
-- 송도국제캠핑장 물놀이장 — 팝업 동시 노출(show_together) 관리
-- 관리자 페이지에서 체크박스로 PC 화면에서 다른 팝업과 나란히(최대 2개)
-- 동시 노출할지 결정할 수 있도록 popups에 show_together 컬럼을 추가합니다.
-- (기본값 false이므로 기존 팝업은 계속 순차 노출됩니다.)
-- ============================================================

alter table popups
  add column if not exists show_together boolean not null default false;
