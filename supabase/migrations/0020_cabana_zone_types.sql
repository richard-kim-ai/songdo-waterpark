-- 케노피 예약 시스템을 평상&케노피 / 그늘막평상 / 썬배드 세 가지 상품 타입으로
-- 확장하기 위한 컬럼 추가. 기존 60개 케노피 요금·예약 행은 기본값으로 그대로
-- '케노피' 타입이 되어 하위 호환됩니다.
alter table public.cabana_zones
  add column if not exists zone_type text not null default '케노피'
  check (zone_type in ('케노피', '그늘막평상', '썬배드'));

alter table public.cabana_zones
  add column if not exists time_type text
  check (time_type in ('주간', '야간', '종일'));

-- 기존 7개 요금 행에 타입 태깅 (이름 문자열 기준, 1회성 데이터 이전)
update public.cabana_zones set zone_type = '케노피', time_type = '주간'
  where name = '주간 (09:30~17:00)';
update public.cabana_zones set zone_type = '케노피', time_type = '야간'
  where name = '야간 (17:30~21:00)';
update public.cabana_zones set zone_type = '케노피', time_type = '종일'
  where name = '종일권 (09:30~21:00)';
update public.cabana_zones set zone_type = '그늘막평상', time_type = '주간'
  where name = '그늘막평상 (09:30~17:00)';
update public.cabana_zones set zone_type = '그늘막평상', time_type = '야간'
  where name = '그늘막평상 (17:30~21:00)';
update public.cabana_zones set zone_type = '그늘막평상', time_type = '종일'
  where name = '그늘막평상 (09:30~21:00)';
update public.cabana_zones set zone_type = '썬배드', time_type = null
  where name = '썬배드 구역';

-- cabana_reservations: 어떤 상품 타입에 대한 예약인지 구분
alter table public.cabana_reservations
  add column if not exists zone_type text not null default '케노피'
  check (zone_type in ('케노피', '그늘막평상', '썬배드'));
