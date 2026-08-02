'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendKakaoNotification } from '@/lib/kakao';
import { sendCustomerReservationAlimtalk } from '@/lib/aligo';
import { ZONE_TYPE_LABELS, type ZoneType } from '@/lib/cabana-pricing';
import { todaySeoul } from '@/lib/date';
import { sendTelegramNotification } from '@/lib/telegram';
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

// 자리를 직접 지정한 예약에 받는 노쇼 방지 예약금 정책.
// 관리자 "예약금 · 입금확인" 화면에서 site_settings로 설정한다.
export type DepositPolicy = {
  enabled: boolean;
  amount: number;
  bankName: string;
  accountNo: string;
  holder: string;
  guide: string;
};

async function getDepositPolicy(supabase: SupabaseAdmin): Promise<DepositPolicy> {
  const { data } = await supabase
    .from('site_settings')
    .select('key,value')
    .in('key', [
      'deposit_enabled',
      'deposit_amount',
      'deposit_bank_name',
      'deposit_account_no',
      'deposit_holder',
      'deposit_guide',
    ]);

  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  const bankName = map.deposit_bank_name ?? '';
  const accountNo = map.deposit_account_no ?? '';
  return {
    // 계좌 정보가 없으면 안내할 수 없으므로 켜져 있어도 비활성으로 본다.
    enabled: map.deposit_enabled === 'true' && !!bankName && !!accountNo,
    amount: Number(map.deposit_amount) || 10000,
    bankName,
    accountNo,
    holder: map.deposit_holder ?? '',
    guide: map.deposit_guide ?? '',
  };
}

/** 공개 예약 폼에서 예약금 안내를 노출하기 위해 정책만 조회. */
export async function getCabanaDepositPolicy(): Promise<DepositPolicy> {
  return getDepositPolicy(createAdminClient());
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
  /** 이 상품(타임 기준)으로 이미 사용 중인 번호 — 고객이 번호를 고를 때 비활성 처리 */
  takenNos: number[];
};

function takenNosFor(
  slots: Map<number, Set<string>> | undefined,
  slotCount: number,
  time: TimeType
) {
  const s = slots ?? new Map<number, Set<string>>();
  const taken: number[] = [];
  for (let n = 1; n <= slotCount; n++) {
    if (timeConflicts(s.get(n) ?? new Set<string>(), time)) taken.push(n);
  }
  return taken;
}

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
      takenNos: takenNosFor(occupancy[z.zone_type], z.unit_count, effectiveTime),
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

// 고객이 조회 화면에서 직접 예약을 취소. 관리자 인증이 없으므로 예약번호(id)만으로는
// 취소할 수 없고, 조회에 사용한 연락처가 예약자 연락처와 일치해야만 처리한다.
// 지난 날짜·방문 완료·현장배정·예약막기 건은 취소 대상에서 제외.
export async function cancelCabanaReservationByPhone(id: string, phone: string) {
  const cleanPhone = phone.trim();
  if (!id || !cleanPhone) return { ok: false as const, error: '취소 정보를 확인할 수 없습니다.' };

  const supabase = createAdminClient();
  const { data: target, error: findError } = await supabase
    .from('cabana_reservations')
    .select('id, phone, reservation_date, is_visited, is_walk_in, is_blocked')
    .eq('id', id)
    .maybeSingle();

  if (findError || !target) return { ok: false as const, error: '예약을 찾을 수 없습니다.' };
  if (target.phone !== cleanPhone || target.is_walk_in || target.is_blocked) {
    return { ok: false as const, error: '취소할 수 없는 예약입니다.' };
  }
  if (target.is_visited) {
    return { ok: false as const, error: '이미 방문 확인된 예약은 취소할 수 없습니다.' };
  }
  if (target.reservation_date < todaySeoul()) {
    return { ok: false as const, error: '지난 예약은 취소할 수 없습니다.' };
  }

  const { error } = await supabase.from('cabana_reservations').delete().eq('id', id);
  if (error) return { ok: false as const, error: '취소 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' };

  revalidatePath('/admin/cabana-reservations');
  return { ok: true as const };
}

function generateReservationNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${cleanDate}${randomStr}`;
}

type CartItem = {
  zoneType: string;
  timeType: TimeType;
  guestCount: number;
  /** 고객이 배치도를 보고 직접 고른 번호. 없으면(0) 빈 자리를 자동 배정한다. */
  cabanaNo?: number;
};
export type ReservedItem = {
  zoneLabel: string;
  timeType: string;
  hasTimeType: boolean;
  cabanaNo: number;
  reservationNo: string;
  price: number;
  /** 자리를 지정해 예약금 입금이 필요한 항목 */
  depositRequired: boolean;
};

// 장바구니(여러 상품)를 한 번에 예약. 각 항목마다 zone_type 내에서 빈 슬롯을 자동 배정하고,
// 같은 요청 안에서 먼저 배정된 슬롯과도 충돌하지 않도록 순차 처리한다.
export async function createCabanaReservation(
  formData: FormData
): Promise<
  | { ok: true; items: ReservedItem[]; deposit: DepositPolicy | null; depositTotal: number }
  | { ok: false; error: string }
> {
  const reservationDate = String(formData.get('reservationDate') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const depositorName = String(formData.get('depositorName') ?? '').trim();
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
  const [guestPolicy, depositPolicy] = await Promise.all([
    getCabanaGuestPolicy(supabase),
    getDepositPolicy(supabase),
  ]);

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

    // 고객이 배치도에서 번호를 골랐으면 그 번호로, 아니면 zone_type 내 빈 슬롯을 순차 배정.
    // 어느 쪽이든 이번 요청에서 앞서 배정된 슬롯까지 반영해 중복을 막는다.
    const slots = (occupancy[zone] ??= new Map<number, Set<string>>());
    const wantedNo = Number(item.cabanaNo) || 0;
    let assigned: number | null = null;

    if (wantedNo > 0) {
      if (wantedNo > count)
        return { ok: false, error: `${zoneLabel(zone)} ${wantedNo}번은 존재하지 않는 자리입니다.` };
      const occ = slots.get(wantedNo) ?? new Set<string>();
      if (timeConflicts(occ, time))
        return {
          ok: false,
          error: `${zoneLabel(zone)} ${wantedNo}번은 방금 다른 분이 예약했습니다. 다른 번호를 선택해주세요.`,
        };
      assigned = wantedNo;
      occ.add(time);
      slots.set(wantedNo, occ);
    } else {
      for (let n = 1; n <= count; n++) {
        const occ = slots.get(n) ?? new Set<string>();
        if (!timeConflicts(occ, time)) {
          assigned = n;
          occ.add(time);
          slots.set(n, occ);
          break;
        }
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

    // 자리를 직접 지정한 항목만 노쇼 방지 예약금 대상.
    const needsDeposit = depositPolicy.enabled && wantedNo > 0;

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
      deposit_status: needsDeposit ? 'pending' : 'none',
      deposit_amount: needsDeposit ? depositPolicy.amount : 0,
      depositor_name: needsDeposit ? depositorName || name : '',
    });
    items.push({
      zoneLabel: zoneLabel(zone),
      timeType: time,
      hasTimeType: !isSingle,
      cabanaNo: assigned,
      reservationNo,
      price,
      depositRequired: needsDeposit,
    });
  }

  const { error } = await supabase.from('cabana_reservations').insert(rows);
  if (error) return { ok: false, error: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.' };

  const totalPrice = items.reduce((sum, it) => sum + it.price, 0);
  const depositTotal = items.filter((it) => it.depositRequired).length * depositPolicy.amount;
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
      `합계: ${totalPrice.toLocaleString('ko-KR')}원`,
      ...(depositTotal > 0
        ? [`예약금 입금대기: ${depositTotal.toLocaleString('ko-KR')}원 (입금자명 ${depositorName || name})`]
        : []),
    ].join('\n')
  );

  // 예약금 대상이면 관리자 텔레그램으로도 즉시 알린다(입금 확인이 필요한 건이므로).
  if (depositTotal > 0) {
    await sendTelegramNotification(
      [
        '💰 <b>예약금 입금 대기</b>',
        `${name}님 · ${summaryLabel}`,
        `예약일자: ${reservationDate}`,
        `입금자명: ${depositorName || name}`,
        `입금 예정액: ${depositTotal.toLocaleString('ko-KR')}원`,
        `예약번호: ${items.map((it) => it.reservationNo).join(', ')}`,
      ].join('\n')
    );
  }

  await sendCustomerReservationAlimtalk(phone, {
    name,
    date: reservationDate,
    timeType: summaryLabel,
    reservationNo: items[0].reservationNo,
  });

  revalidatePath('/admin/cabana-reservations');
  revalidatePath('/admin/deposit');
  return {
    ok: true,
    items,
    deposit: depositTotal > 0 ? depositPolicy : null,
    depositTotal,
  };
}
