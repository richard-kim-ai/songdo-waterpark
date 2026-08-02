-- 오픈뱅킹 테스트베드/운영 구분과 scope 설정
--
-- 테스트베드(testapi.openbanking.or.kr)와 운영(openapi.openbanking.or.kr)은
-- client_id·이용기관코드가 서로 다르고 도메인도 달라, 잘못 조합하면
-- authorize 단계에서 "인증요청거부-인증 파라미터 오류"로 거부된다.
--
-- scope도 이용기관이 실제로 신청한 서비스와 일치해야 한다.
-- 거래내역 조회만 쓰면 'login inquiry'.
alter table public.deposit_settings
  add column if not exists openbanking_use_test boolean not null default true,
  add column if not exists openbanking_scope text not null default 'login inquiry';
