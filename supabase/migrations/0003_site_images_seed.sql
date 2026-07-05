-- ============================================================
-- 송도국제캠핑장 물놀이장 — 사이트 고정 이미지 시드
-- 로고/메인배경/배치도/안전수칙/지도 등 "그외 이미지"를 관리자에서 교체할 수 있도록
-- site_settings 테이블에 `site_image_<key>` = 스토리지 경로 형태로 보관합니다.
-- (별도 테이블 없이 기존 site_settings(0002)를 재사용 — 신규 DDL 불필요)
-- ============================================================

insert into site_settings (key, value) values
  ('site_image_logo', 'logo.png'),
  ('site_image_hero', 'hero.jpg'),
  ('site_image_layout_master', 'layout-master.jpg'),
  ('site_image_layout_cabana', 'layout-cabana.jpg'),
  ('site_image_cabana_diagram', 'cabana-diagram.jpg'),
  ('site_image_train', 'train.jpg'),
  ('site_image_car', 'car.jpg'),
  ('site_image_safety_rules', 'safety-rules.jpeg'),
  ('site_image_map', 'map-placeholder.png')
on conflict (key) do nothing;
