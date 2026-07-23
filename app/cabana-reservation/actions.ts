'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendKakaoNotification } from '@/lib/kakao';
import { sendCustomerReservationAlimtalk } from '@/lib/aligo';
import type { Database } from '@/types/database';

const TOTAL_CABANAS = 60;
type TimeType = '주간' | '야간' | '종일';

type ReservationRow = Database['public']['Tables']['cabana_reservations']['Row'];

function countBooked(reservations: Pick<ReservationRow, 'time_type'>[], slot: '주간' | '야간') {
  return reservations.filter((r) => r.time_type === slot || r.time_type === '종일').length;
}

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

async function getCabanaPriceByType(supabase: SupabaseAdmin): Promise<Record<TimeType, number>> {
  const { data: zones } = await supabase
    .from('cabana_zones')
    .select('weekday_price')
    .order('sort_order')
    .limit(3);
  const zoneList = zones ?? [];
  return {
    주간: zoneList[0]?.weekday_price ?? 0,
    야간: zoneList[1]?.weekday_price ?? 0,
    종일: zoneList[2]?.weekday_price ?? 0,
  };
}

export async function getCabanaAvailability(date: string) {
  const supabase = createAdminClient();

  const [{ data }, guestPolicy, priceByType] = await Promise.all([
    supabase.from('cabana_reservations').select('time_type, cabana_no').eq('reservation_date', date),
    getCabanaGuestPolicy(supabase),
    getCabanaPriceByType(supabase),
  ]);

  const reservations = data ?? [];
  const dayLeft = Math.max(0, TOTAL_CABANAS - countBooked(reservations, '주간'));
  const nightLeft = Math.max(0, TOTAL_CABANAS - countBooked(reservations, '야간'));
  // 종일 예약은 완전히 비어있는(주간/야간 어느 쪽도 예약되지 않은) 케노피만 배정 가능하므로
  // 잔여 수량도 min(주간잔여, 야간잔여)가 아니라 실제로 아무 예약도 없는 케노피 수로 계산해야 함.
  const bookedCabanaNos = new Set(reservations.map((r) => r.cabana_no));
  const fullDayLeft = Math.max(0, TOTAL_CABANAS - bookedCabanaNos.size);

  return { dayLeft, nightLeft, fullDayLeft, guestPolicy, priceByType };
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
    .limit(20);

  if (error) return [];
  return data ?? [];
}

function generateReservationNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${cleanDate}${randomStr}`;
}

export async function createCabanaReservation(
  formData: FormData
): Promise<
  | { ok: true; reservationNo: string; cabanaNo: number }
  | { ok: false; error: string }
> {
  const reservationDate = String(formData.get('reservationDate') ?? '').trim();
  const timeType = String(formData.get('timeType') ?? '') as TimeType;
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const guestCount = Number(formData.get('guestCount') ?? 1);
  const isCamping = formData.get('isCamping') === 'true';
  const hasAdmission = isCamping || formData.get('hasAdmission') === 'true';

  if (!reservationDate) return { ok: false, error: '예약 일자를 선택해주세요.' };
  if (!['주간', '야간', '종일'].includes(timeType))
    return { ok: false, error: '이용권 종류를 선택해주세요.' };
  if (!name || name.length > 50) return { ok: false, error: '예약자 성함을 입력해주세요.' };
  if (!phone || phone.length > 20) return { ok: false, error: '연락처를 입력해주세요.' };
  if (!Number.isFinite(guestCount) || guestCount < 1)
    return { ok: false, error: '이용 인원수를 확인해주세요.' };

  const supabase = createAdminClient();

  const guestPolicy = await getCabanaGuestPolicy(supabase);
  if (guestCount > guestPolicy.maxCount) {
    return {
      ok: false,
      error: `케노피 1개당 최대 ${guestPolicy.maxCount}명까지 예약 가능합니다. 초과 인원은 케노피를 추가로 예약해주세요.`,
    };
  }

  const { data: existing } = await supabase
    .from('cabana_reservations')
    .select('cabana_no, time_type')
    .eq('reservation_date', reservationDate);

  const reservations = existing ?? [];
  const bookedCabanas = new Set(
    reservations
      .filter((r) => timeType === '종일' || r.time_type === timeType || r.time_type === '종일')
      .map((r) => r.cabana_no)
  );

  let assignedCabana: number | null = null;
  for (let i = 1; i <= TOTAL_CABANAS; i++) {
    if (!bookedCabanas.has(i)) {
      assignedCabana = i;
      break;
    }
  }

  if (!assignedCabana)
    return { ok: false, error: '선택하신 날짜의 해당 타임 케노피가 모두 매진되었습니다.' };

  const reservationNo = generateReservationNo(reservationDate);

  const priceByType = await getCabanaPriceByType(supabase);
  const extraGuests = Math.max(0, guestCount - guestPolicy.baseCount);
  const totalPrice = (priceByType[timeType] ?? 0) + extraGuests * guestPolicy.extraFee;

  const { error } = await supabase.from('cabana_reservations').insert({
    reservation_no: reservationNo,
    reservation_date: reservationDate,
    cabana_no: assignedCabana,
    time_type: timeType,
    name,
    phone,
    guest_count: guestCount,
    is_camping: isCamping,
    has_admission: hasAdmission,
    price_override: totalPrice,
  });

  if (error) return { ok: false, error: '예약 처리 중 오류가 발생했습니다.' };

  await sendKakaoNotification(
    [
      `[케노피 예약] ${name}님 · ${timeType} · 예약번호 ${reservationNo}`,
      `예약일자: ${reservationDate}`,
      `이용권: ${timeType}`,
      `예약자: ${name}`,
      `연락처: ${phone}`,
      `인원수: ${guestCount}명`,
      `캠핑장 이용: ${isCamping ? '예' : '아니오'}`,
      `배정 케노피: ${assignedCabana}번 (현장 배정은 선착순)`,
      `예약번호: ${reservationNo}`,
    ].join('\n')
  );

  await sendCustomerReservationAlimtalk(phone, {
    name,
    date: reservationDate,
    timeType,
    reservationNo,
  });

  revalidatePath('/admin/cabana-reservations');
  return { ok: true, reservationNo, cabanaNo: assignedCabana };
}
