'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendKakaoNotification } from '@/lib/kakao';
import { sendCustomerReservationAlimtalk } from '@/lib/aligo';
import { ZONE_TYPE_LABELS, type ZoneType } from '@/lib/cabana-pricing';
import type { Database } from '@/types/database';

type TimeType = '주간' | '야간' | '종일';
type ReservationInsert = Database['public']['Tables']['cabana_reservations']['Insert'];

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

// 예약 인원 정책(기본 인원/추가 인원당 요금/최대 인원)은 관리자 "케노피 판매 관리" 화면에서
// site_settings로 설정. 값이 없으면 예시 기본값(4명/3,000원/6명)을 사용.
async function getCabanaGuestPolicy(supabase: SupabaseAdmin) {
  const { data } = await supabase
    .from('site_settings')
    .select('key,value')
    .in('key', ['cabana_guest_base_count', 'cabana_guest_extra_fee', 'cabana_guest_max_count']);

  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  return {
    baseCount: Number(map.cabana_guest_base_count) || 4,
    extraFee: Number(map.cabana_guest_extra_fee) || 3000,
    maxCount: Number(map.cabana_guest_max_count) || 6,
  };
}

function zoneLabel(zoneType: string) {
  return ZONE_TYPE_LABELS[zoneType as ZoneType] ?? zoneType;
}

// 어떤 슬롯(cabana_no)이 특정 타임을 새로 예약할 수 있는지 판단.
// 종일은 완전히 빈 슬롯에만, 주간/야간은 같은 타임이나 종일이 없는 슬롯에만 배정 가능.
function timeConflicts(occupied: Set<string>, time: TimeType) {
  if (time === '종일') return occupied.size > 0;
  if (occupied.has('종일')) return true;
  return occupied.has(time);
}

// 해당 날짜의 예약을 zone_type별로 묶어 슬롯 점유 현황(Map<cabana_no, Set<time>>)으로 정리.
function buildOccupancy(
  reservations: { zone_type: string; time_type: string; cabana_no: number }[]
) {
  const occ: Record<string, Map<number, Set<string>>> = {};
  for (const r of reservations) {
    const slots = (occ[r.zone_type] ??= new Map());
    const set = slots.get(r.cabana_no) ?? new Set<string>();
    set.add(r.time_type);
    slots.set(r.cabana_no, set);
  }
  return occ;
}

function countLeft(slots: Map<number, Set<string>> | undefined, slotCount: number, time: TimeType) {
  const s = slots ?? new Map<number, Set<string>>();
  let used = 0;
  for (let n = 1; n <= slotCount; n++) {
    const occupied = s.get(n) ?? new Set<string>();
    if (timeConflicts(occupied, time)) used += 1;
  }
  return Math.max(0, slotCount - used);
}

export type CabanaProduct = {
  zoneType: string;
  zoneLabel: string;
  timeType: TimeType; // 예약에 실제 저장되는 타임 (썬배드처럼 단일가격 상품은 '종일')
  hasTimeType: boolean; // false면 단일가격(썬배드류) — 인원 초과요금 없음
  name: string; // 요금표 구역명 (예: "주간 (09:30~17:00)")
  price: number;
  left: number;
  slotCount: number;
};

// 공개 예약 폼: 케노피/그늘막평상/썬배드 전 상품의 (zone_type, time_type)별
// 잔여 수량·성수기 요금·슬롯 수를 한 번에 반환한다.
export async function getCabanaAvailability(date: string) {
  const supabase = createAdminClient();

  const [{ data: zones }, { data: reservations }, guestPolicy] = await Promise.all([
    supabase
      .from('cabana_zones')
      .select('name, zone_type, time_type, unit_count, weekday_price')
      .order('sort_order'),
    supabase
      .from('cabana_reservations')
      .select('zone_type, time_type, cabana_no')
      .eq('reservation_date', date),
    getCabanaGuestPolicy(supabase),
  ]);

  const occupancy = buildOccupancy(reservations ?? []);

  const products: CabanaProduct[] = (zones ?? []).map((z) => {
    const effectiveTime = (z.time_type ?? '종일') as TimeType;
    return {
      zoneType: z.zone_type,
      zoneLabel: zoneLabel(z.zone_type),
      timeType: effectiveTime,
      hasTimeType: z.time_type !== null,
      name: z.name,
      price: z.weekday_price,
      left: countLeft(occupancy[z.zone_type], z.unit_count, effectiveTime),
      slotCount: z.unit_count,
    };
  });

  return { products, guestPolicy };
}

// 예약 확정 폼에서 연락처를 입력해 본인 예약 내역을 직접 조회하는 공개 조회 기능.
// 전화번호가 정확히 일치하는 예약만 반환 (예약막기는 phone이 빈 문자열이라 자연히 제외됨).
export async function lookupCabanaReservationsByPhone(phone: string) {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('cabana_reservations')
    .select('*')
    .eq('phone', cleanPhone)
    .order('reservation_date', { ascending: false })
    .limit(30);

  if (error) return [];
  return data ?? [];
}

function generateReservationNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${cleanDate}${randomStr}`;
}

type CartItem = { zoneType: string; timeType: TimeType; guestCount: number };
export type ReservedItem = {
  zoneLabel: string;
  timeType: string;
  hasTimeType: boolean;
  cabanaNo: number;
  reservationNo: string;
  price: number;
};

// 장바구니(여러 상품)를 한 번에 예약. 각 항목마다 zone_type 내에서 빈 슬롯을 자동 배정하고,
// 같은 요청 안에서 먼저 배정된 슬롯과도 충돌하지 않도록 순차 처리한다.
export async function createCabanaReservation(
  formData: FormData
): Promise<{ ok: true; items: ReservedItem[] } | { ok: false; error: string }> {
  const reservationDate = String(formData.get('reservationDate') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const isCamping = formData.get('isCamping') === 'true';
  const hasAdmission = isCamping || formData.get('hasAdmission') === 'true';

  let cart: CartItem[];
  try {
    cart = JSON.parse(String(formData.get('cart') ?? '[]'));
  } catch {
    return { ok: false, error: '예약 항목을 확인해주세요.' };
  }

  if (!reservationDate) return { ok: false, error: '예약 일자를 선택해주세요.' };
  if (!name || name.length > 50) return { ok: false, error: '예약자 성함을 입력해주세요.' };
  if (!phone || phone.length > 20) return { ok: false, error: '연락처를 입력해주세요.' };
  if (!Array.isArray(cart) || cart.length === 0)
    return { ok: false, error: '예약할 상품을 1개 이상 추가해주세요.' };

  const supabase = createAdminClient();
  const guestPolicy = await getCabanaGuestPolicy(supabase);

  const { data: zones } = await supabase
    .from('cabana_zones')
    .select('zone_type, time_type, unit_count, weekday_price');

  // priceMap["zone|time"] = 단가, slotCount[zone] = 개수, singlePrice[zone] = 단일가격(썬배드류) 여부
  const priceMap: Record<string, number> = {};
  const slotCount: Record<string, number> = {};
  const singlePrice: Record<string, boolean> = {};
  for (const z of zones ?? []) {
    const effectiveTime = z.time_type ?? '종일';
    priceMap[`${z.zone_type}|${effectiveTime}`] = z.weekday_price;
    slotCount[z.zone_type] = z.unit_count;
    if (z.time_type !== null) singlePrice[z.zone_type] = singlePrice[z.zone_type] ?? false;
    else singlePrice[z.zone_type] = true;
  }

  const { data: existing } = await supabase
    .from('cabana_reservations')
    .select('zone_type, time_type, cabana_no')
    .eq('reservation_date', reservationDate);

  const occupancy = buildOccupancy(existing ?? []);
  const usedNos = new Set<string>();
  const rows: ReservationInsert[] = [];
  const items: ReservedItem[] = [];

  for (const item of cart) {
    const zone = item.zoneType;
    const count = slotCount[zone];
    if (count === undefined) return { ok: false, error: '선택하신 상품 정보를 찾을 수 없습니다.' };

    const isSingle = singlePrice[zone] === true;
    const time: TimeType = isSingle ? '종일' : item.timeType;
    if (!isSingle && !['주간', '야간', '종일'].includes(time))
      return { ok: false, error: '이용권 종류를 선택해주세요.' };

    const basePrice = priceMap[`${zone}|${time}`];
    if (basePrice === undefined) return { ok: false, error: '선택하신 상품의 요금 정보를 찾을 수 없습니다.' };

    // 인원수: 단일가격 상품은 1명 고정(초과요금 없음), 평상류는 최대 인원 이내
    const guestCount = isSingle
      ? 1
      : Math.max(1, Math.min(Number(item.guestCount) || 1, guestPolicy.maxCount));

    // zone_type 내에서 빈 슬롯 순차 배정 (이번 요청에서 앞서 배정된 슬롯도 반영)
    const slots = (occupancy[zone] ??= new Map<number, Set<string>>());
    let assigned: number | null = null;
    for (let n = 1; n <= count; n++) {
      const occ = slots.get(n) ?? new Set<string>();
      if (!timeConflicts(occ, time)) {
        assigned = n;
        occ.add(time);
        slots.set(n, occ);
        break;
      }
    }
    if (assigned === null)
      return {
        ok: false,
        error: `${zoneLabel(zone)}${isSingle ? '' : ` ${time}`}이(가) 매진되어 예약할 수 없습니다.`,
      };

    const extraGuests = isSingle ? 0 : Math.max(0, guestCount - guestPolicy.baseCount);
    const price = basePrice + extraGuests * guestPolicy.extraFee;

    let reservationNo = generateReservationNo(reservationDate);
    while (usedNos.has(reservationNo)) reservationNo = generateReservationNo(reservationDate);
    usedNos.add(reservationNo);

    rows.push({
      reservation_no: reservationNo,
      reservation_date: reservationDate,
      zone_type: zone,
      cabana_no: assigned,
      time_type: time,
      name,
      phone,
      guest_count: guestCount,
      is_camping: isCamping,
      has_admission: hasAdmission,
      price_override: price,
    });
    items.push({
      zoneLabel: zoneLabel(zone),
      timeType: time,
      hasTimeType: !isSingle,
      cabanaNo: assigned,
      reservationNo,
      price,
    });
  }

  const { error } = await supabase.from('cabana_reservations').insert(rows);
  if (error) return { ok: false, error: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.' };

  const totalPrice = items.reduce((sum, it) => sum + it.price, 0);
  const summaryLabel =
    items.length === 1
      ? `${items[0].zoneLabel}${items[0].hasTimeType ? ` ${items[0].timeType}` : ''}`
      : `${items[0].zoneLabel}${items[0].hasTimeType ? ` ${items[0].timeType}` : ''} 외 ${items.length - 1}건`;

  await sendKakaoNotification(
    [
      `[실시간 예약] ${name}님 · ${summaryLabel}`,
      `예약일자: ${reservationDate}`,
      `연락처: ${phone}`,
      `캠핑장 이용: ${isCamping ? '예' : '아니오'}`,
      '',
      ...items.map(
        (it) =>
          `- ${it.zoneLabel}${it.hasTimeType ? ` ${it.timeType}` : ''} · ${it.cabanaNo}번 · ${it.price.toLocaleString('ko-KR')}원 (예약번호 ${it.reservationNo})`
      ),
      '',
      `합계: ${totalPrice.toLocaleString('ko-KR')}원 (현장 배정은 선착순)`,
    ].join('\n')
  );

  await sendCustomerReservationAlimtalk(phone, {
    name,
    date: reservationDate,
    timeType: summaryLabel,
    reservationNo: items[0].reservationNo,
  });

  revalidatePath('/admin/cabana-reservations');
  return { ok: true, items };
}
