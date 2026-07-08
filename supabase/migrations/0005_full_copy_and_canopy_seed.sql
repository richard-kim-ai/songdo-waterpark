-- ============================================================
-- 송도국제캠핑장 물놀이장 — 홈페이지 전체 문구 관리자 편집 확장
-- 히어로 CTA, 헤더/모바일 네비게이션, 입장권/부속시설/케노피/시설배치도/
-- 이용시간안내/갤러리/안전수칙/푸터 섹션의 제목·부제목·안내문구를
-- 관리자 '카피 수정' 탭에서 편집할 수 있도록 site_settings에 시드합니다.
-- 아울러 "카바나" 표기를 "케노피"로 통일합니다.
-- ============================================================

insert into site_settings (key, value) values
  ('hero_cta_ticket_label', '입장권 구매하기'),
  ('hero_cta_cabana_label', '케노피 예약하기'),
  ('nav_pricing_label', '입장권 안내'),
  ('nav_cabana_label', '케노피'),
  ('nav_facilities_label', '부속시설'),
  ('nav_info_label', '이용안내'),
  ('nav_gallery_label', '갤러리'),
  ('mobile_nav_ticket_label', '입장권 구매'),
  ('mobile_nav_cabana_label', '케노피 예약'),
  ('pricing_title', '입장권 안내'),
  ('pricing_subtitle', '합리적인 가격으로 즐기는 시원한 물놀이'),
  ('pricing_pool_section_title', '수영장 및 발물놀이터 입장권'),
  ('pricing_purchase_notice', '당일 구매 가능 (현장 상황에 따라 유동)'),
  ('pricing_family_section_title', '가족 패키지 (빅2 포함)'),
  ('pricing_general_button_label', '시즌권 구매'),
  ('pricing_family_button_label', '패키지 구매'),
  ('facilities_title', '부속 놀이시설'),
  ('facilities_subtitle', '아이들이 좋아하는 신나는 놀이기구'),
  ('facilities_package_desc', '두 가지 놀이기구를 모두 즐기세요'),
  ('cabana_title', '케노피 예약'),
  ('cabana_subtitle', '프라이빗한 공간에서 편안한 휴식을 즐기세요'),
  ('cabana_diagram_title', '케노피 배치도'),
  ('cabana_table_title', '구역별 금액 안내'),
  ('cabana_notice_title', '안내사항'),
  ('cabana_booking_button_label', '케노피 예약하기'),
  ('layout_title', '시설 배치도'),
  ('layout_subtitle', '송도국제캠핑장 물놀이장 전체 안내'),
  ('layout_tab_total_label', '전체 배치도'),
  ('layout_tab_cabana_label', '케노피 배치도'),
  ('info_title', '이용시간 안내'),
  ('info_subtitle', '운영 시간을 확인하고 방문 계획을 세우세요'),
  ('info_pool_card_title', '물놀이장 운영시간'),
  ('info_facility_card_title', '부속시설 운영시간'),
  ('gallery_title', '포토 갤러리'),
  ('gallery_subtitle', '송도국제캠핑장 물놀이장의 생생한 모습'),
  ('safety_banner_title', '수영장 이용 10대 안전수칙'),
  ('safety_rules_text', '지도자 안전요령 숙지|수영장 이용 전 반드시 안전 수칙을 확인하세요
이용 전 준비운동 필수|충분한 준비운동으로 안전사고를 예방하세요
안전장비 착용 확인|수영모, 구명조끼 등 필요한 안전장비를 착용하세요
물 깊이 확인하기|입수 전 반드시 수심을 확인하고 천천히 들어가세요
심신에 어려움 시 입수 금지|몸 상태가 좋지 않을 때는 이용을 자제하세요
입주자간 50분 휴식시간|장시간 이용 시 충분한 휴식을 취하세요
음주 후 No No|음주 후에는 절대 입장 및 이용이 불가합니다
절대 뛰지 않기|수영장 내에서는 걸어서 이동하세요
바로 입수 금지|샤워 후 물에 서서히 적응한 뒤 입수하세요
청결운동 꼭!|이용 전후 반드시 샤워를 하세요'),
  ('safety_extra_title', '추가 안내사항'),
  ('safety_extra_items', '어린이 보호자 동반|만 13세 이하 어린이는 반드시 보호자와 함께 이용해야 합니다
안전요원 배치|운영시간 동안 전문 안전요원이 상주하여 안전을 관리합니다
응급처치 시설|응급상황 발생 시 즉시 대응할 수 있는 의료시설이 구비되어 있습니다'),
  ('footer_tagline', '송도국제캠핑장 물놀이장에서 가족과 함께 특별한 여름 추억을 만들어보세요'),
  ('footer_address_title', '찾아오시는 길'),
  ('footer_hours_title', '운영 시간'),
  ('footer_terms_label', '이용약관'),
  ('footer_privacy_label', '개인정보처리방침')
on conflict (key) do nothing;

-- 기존 값에 남아있던 "카바나(평상)" 표기를 "케노피(평상)"로 통일
update site_settings
  set value = replace(value, '카바나(평상)', '케노피(평상)')
  where key in ('cabana_notice', 'faq_item_3_lines');

-- 포토갤러리 캡션에 남아있던 "카바나" 표기를 "케노피"로 통일
update gallery_images
  set label = replace(label, '카바나', '케노피')
  where label like '%카바나%';
