// 케노피 예약 구분별 할인율. 서버 액션 파일('use server')은 함수 외 값을
// export할 수 없어, 서버·클라이언트 양쪽에서 쓰는 이 상수는 별도 파일로 분리.
export const DISCOUNT_TYPES = ['일반', '단체', '장애인/유공자'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_MULTIPLIER: Record<DiscountType, number> = {
  일반: 1,
  단체: 0.8, // 20% 할인
  '장애인/유공자': 0.5, // 50% 할인
};

// 케노피 예약 관리에서 다루는 상품 타입. 각 타입은 독립된 슬롯 번호 체계(1~N)를 가짐.
export const ZONE_TYPES = ['케노피', '그늘막평상', '썬배드'] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  케노피: '평상&케노피',
  그늘막평상: '그늘막평상',
  썬배드: '썬배드',
};
