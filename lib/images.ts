const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images`;

export function publicUrl(path: string) {
  return `${base}/${path}`;
}

export const images = {
  logo: `${base}/logo.png`,
  hero: `${base}/hero.jpg`,
  layoutMaster: `${base}/layout-master.jpg`,
  layoutCabana: `${base}/layout-cabana.jpg`,
  cabanaDiagram: `${base}/cabana-diagram.jpg`,
  train: `${base}/train.jpg`,
  car: `${base}/car.jpg`,
  gallery1: `${base}/gallery-1.jpg`,
  gallery2: `${base}/gallery-2.jpg`,
  gallery3: `${base}/gallery-3.jpg`,
  gallery4: `${base}/gallery-4.jpg`,
  gallery5: `${base}/gallery-5.jpg`,
  gallery6: `${base}/gallery-6.jpg`,
  safetyRules: `${base}/safety-rules.jpeg`,
  mapPlaceholder: `${base}/map-placeholder.png`,
};

// ============================================================
// 사이트 고정 이미지 (포토갤러리 외) — 관리자 "그외 이미지 관리"에서 교체 가능.
// 저장소: site_settings 테이블에 `site_image_<key>` = 스토리지 경로 형태로 보관.
// ============================================================
export const SITE_IMAGE_KEYS = [
  'logo',
  'hero',
  'layout_master',
  'layout_cabana',
  'cabana_diagram',
  'train',
  'car',
  'safety_rules',
  'map',
  'parking_info',
  'squirrel_tub',
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];

export const SITE_IMAGE_SETTING_PREFIX = 'site_image_';

export function siteImageSettingKey(key: SiteImageKey) {
  return `${SITE_IMAGE_SETTING_PREFIX}${key}`;
}

/** 최초 시드/폴백 경로 (img 폴더 원본과 동일한 스토리지 경로) */
export const SITE_IMAGE_DEFAULT_PATH: Record<SiteImageKey, string> = {
  logo: 'logo.png',
  hero: 'hero.jpg',
  layout_master: 'layout-master.jpg',
  layout_cabana: 'layout-cabana.jpg',
  cabana_diagram: 'layout-cabana.jpg',
  train: 'train.jpg',
  car: 'car.jpg',
  safety_rules: 'safety-rules.jpeg',
  map: 'map-placeholder.png',
  parking_info: '',
  squirrel_tub: '',
};

export const SITE_IMAGE_LABEL: Record<SiteImageKey, string> = {
  logo: '로고',
  hero: '메인 배경 (Hero)',
  layout_master: '전체 배치도',
  layout_cabana: '평상&케노피 배치도 (시설 배치도 탭)',
  cabana_diagram: '평상&케노피 안내 이미지 (예약 섹션)',
  train: '신나는기차 이미지',
  car: '마이카 이미지',
  safety_rules: '안전수칙 이미지',
  map: '오시는 길 지도',
  parking_info: '주차 안내 이미지',
  squirrel_tub: '다람쥐통 이미지',
};

// 프론트에 최적화되는 권장 이미지 크기(픽셀). 관리자 업로드 화면에 안내로 표시.
// 실제 업로드 이미지는 긴 변 최대 1600px로 자동 리사이즈됨.
export const SITE_IMAGE_RECOMMENDED: Record<SiteImageKey, string> = {
  logo: '800 × 400',
  hero: '1600 × 900',
  layout_master: '1600 × 400',
  layout_cabana: '1050 × 824',
  cabana_diagram: '1050 × 824',
  train: '800 × 600',
  car: '800 × 600',
  safety_rules: '800 × 1200',
  map: '800 × 500',
  parking_info: '1200 × 800',
  squirrel_tub: '800 × 600',
};

export type SiteImages = Record<SiteImageKey, string>;

/**
 * site_settings 맵(key→value)에서 사이트 고정 이미지 URL을 만들어 반환.
 * 값이 없으면 기본 경로로 폴백하므로 마이그레이션/시드 전에도 안전하게 동작.
 */
export function resolveSiteImages(settings: Record<string, string>): SiteImages {
  const result = {} as SiteImages;
  for (const key of SITE_IMAGE_KEYS) {
    const path = settings[siteImageSettingKey(key)] || SITE_IMAGE_DEFAULT_PATH[key];
    result[key] = path ? publicUrl(path) : '';
  }
  return result;
}
