-- ============================================================
-- 송도국제캠핑장 물놀이장 — 카피(문구) 수정 관리 시드
-- 메인 화면(Hero) 제목/부제목, 중간 배너 문구, 안전수칙 상단 제목/설명,
-- 푸터 연락처/저작권 문구를 관리자 '카피 수정' 탭에서 편집할 수 있도록
-- site_settings에 시드합니다. (별도 테이블 없이 기존 site_settings 재사용)
-- ============================================================

insert into site_settings (key, value) values
  ('hero_title', '송도국제캠핑장
물놀이장에서
즐거운 여름을 만나세요'),
  ('hero_subtitle', '시원하게 딱 트인 수영장/발물놀이터와 편안한 카바나에서
가족과 함께 특별한 추억을 만드세요'),
  ('benefit_title', '캠핑장 이용 고객 특별 혜택'),
  ('benefit_subtitle', '수영장 및 발물놀이터 입장권 무료'),
  ('benefit_note', '(단, 입장객 수용 인원 초과 시 입장 불가)'),
  ('safety_title', '수영장 안전수칙'),
  ('safety_subtitle', '안전하고 즐거운 물놀이를 위한 필수 수칙'),
  ('footer_address', '인천광역시 연수구 송도동 123-45'),
  ('footer_phone', '032-123-4567'),
  ('footer_email', 'info@songdocamping.com'),
  ('footer_copyright', '© 2026 송도국제캠핑장. All rights reserved.')
on conflict (key) do nothing;
