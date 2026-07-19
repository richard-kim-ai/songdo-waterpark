// 케노피 예약 구분별 할인율. 서버 액션 파일('use server')은 함수 외 값을
// export할 수 없어, 서버·클라이언트 양쪽에서 쓰는 이 상수는 별도 파일로 분리.
export const DISCOUNT_TYPES = ['일반', '단체', '장애인/유공자'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_MULTIPLIER: Record<DiscountType, number> = {
  일반: 1,
  단체: 0.8, // 20% 할인
  '장애인/유공자': 0.5, // 50% 할인
};
