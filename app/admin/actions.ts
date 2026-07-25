'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requirePagePermission } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImage, removeImage } from '@/lib/admin/storage';
import {
  DISCOUNT_MULTIPLIER,
  ZONE_TYPES,
  ZONE_TYPE_LABELS,
  type DiscountType,
  type ZoneType,
} from '@/lib/cabana-pricing';
import { saveKakaoConfig, disconnectKakao, sendKakaoTestMessage } from '@/lib/kakao';
import { saveAligoConfig, sendAligoTestMessage } from '@/lib/aligo';
import type { Database } from '@/types/database';

function revalidateSite() {
  revalidatePath('/');
}

// ---------- 입장권 / 부속시설 ----------
export async function upsertTicket(
  id: string,
  data: {
    name: string;
    description: string;
    price: number;
    purchase_url: string | null;
    usage_hours: string | null;
    is_active: boolean;
  }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('ticket_types')
    .update({
      name: data.name,
      description: data.description || null,
      price: data.price,
      purchase_url: data.purchase_url || null,
      usage_hours: data.usage_hours || null,
      is_active: data.is_active,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/tickets');
  revalidatePath('/admin/facilities');
}

export async function createTicket(category: string, sortOrder: number) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('ticket_types').insert({
    category,
    name: '새 놀이기구',
    description: '',
    price: 0,
    purchase_url: null,
    usage_hours: '',
    is_active: true,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/facilities');
}

// ---------- 카바나 구역 ----------
export async function upsertCabanaZone(
  id: string,
  data: { name: string; weekday_price: number; weekend_price: number; unit_count: number }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('cabana_zones')
    .update({
      name: data.name,
      weekday_price: data.weekday_price,
      weekend_price: data.weekend_price,
      unit_count: data.unit_count,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/cabana');
}

// 평상&케노피/그늘막평상/썬배드 요금표에 새 항목(행)을 추가.
export async function createCabanaZone(data: {
  zoneType: string;
  timeType: string | null;
  name: string;
  unitCount: number;
  price: number;
  sortOrder: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('cabana_zones').insert({
    zone_type: data.zoneType,
    time_type: data.timeType,
    name: data.name,
    capacity: 1,
    unit_count: data.unitCount,
    weekday_price: data.price,
    weekend_price: data.price,
    sort_order: data.sortOrder,
  });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/cabana');
}

export async function deleteCabanaZone(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('cabana_zones').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/cabana');
}

// ---------- 사이트 설정(이용시간 안내 텍스트) ----------
export async function upsertSiteSetting(key: string, value: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/copy');
}

// 케노피 예약 인원 정책: 기본 인원수, 초과 인원당 요금, 최대 예약 가능 인원수.
// 예) 기본 4명 / 초과 1명당 3,000원 / 최대 6명(또는 12명 등 관리자가 조정)
export async function saveCabanaGuestPolicy(data: {
  baseCount: number;
  extraFee: number;
  maxCount: number;
}) {
  const { supabase } = await requireAdmin();

  if (data.baseCount < 1 || data.maxCount < data.baseCount || data.extraFee < 0) {
    throw new Error('입력값을 확인해주세요. (최대 인원은 기본 인원수 이상이어야 합니다)');
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('site_settings').upsert([
    { key: 'cabana_guest_base_count', value: String(data.baseCount), updated_at: now },
    { key: 'cabana_guest_extra_fee', value: String(data.extraFee), updated_at: now },
    { key: 'cabana_guest_max_count', value: String(data.maxCount), updated_at: now },
  ]);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/cabana');
}

// ---------- 사이트 고정 이미지(로고/배경/배치도 등) ----------
export async function updateSiteImage(settingKey: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) {
    throw new Error('이미지 파일을 선택해주세요.');
  }

  const imagePath = await uploadImage(supabase, file, 'site');

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: settingKey, value: imagePath, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/site-images');
}

// ---------- 팝업 ----------
export async function createPopup(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get('title') ?? '');
  const linkUrl = String(formData.get('link_url') ?? '') || null;
  const isActive = formData.get('is_active') === 'on';
  const showTogether = formData.get('show_together') === 'on';
  const startDate = String(formData.get('start_date') ?? '') || null;
  const endDate = String(formData.get('end_date') ?? '') || null;
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const file = formData.get('image') as File | null;

  let imagePath: string | null = null;
  if (file && file.size > 0) {
    imagePath = await uploadImage(supabase, file, 'popups');
  }

  const { error } = await supabase.from('popups').insert({
    title,
    link_url: linkUrl,
    is_active: isActive,
    show_together: showTogether,
    start_date: startDate,
    end_date: endDate,
    sort_order: sortOrder,
    image_path: imagePath,
  });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/popups');
}

export async function updatePopup(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get('title') ?? '');
  const linkUrl = String(formData.get('link_url') ?? '') || null;
  const isActive = formData.get('is_active') === 'on';
  const showTogether = formData.get('show_together') === 'on';
  const startDate = String(formData.get('start_date') ?? '') || null;
  const endDate = String(formData.get('end_date') ?? '') || null;
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const file = formData.get('image') as File | null;

  const update: Database['public']['Tables']['popups']['Update'] = {
    title,
    link_url: linkUrl,
    is_active: isActive,
    show_together: showTogether,
    start_date: startDate,
    end_date: endDate,
    sort_order: sortOrder,
  };

  if (file && file.size > 0) {
    update.image_path = await uploadImage(supabase, file, 'popups');
  }

  const { error } = await supabase.from('popups').update(update).eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/popups');
}

export async function deletePopup(id: string, imagePath: string | null) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('popups').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await removeImage(supabase, imagePath);

  revalidateSite();
  revalidatePath('/admin/popups');
}

// ---------- 포토 갤러리 ----------
export async function createGalleryImage(formData: FormData) {
  const { supabase } = await requireAdmin();

  const label = String(formData.get('label') ?? '');
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0) {
    throw new Error('이미지 파일을 선택해주세요.');
  }

  const imagePath = await uploadImage(supabase, file, 'gallery');

  const { error } = await supabase.from('gallery_images').insert({
    label,
    image_path: imagePath,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/gallery');
}

export async function updateGalleryImage(
  id: string,
  data: { label: string; sort_order: number }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('gallery_images')
    .update({ label: data.label, sort_order: data.sort_order })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/gallery');
}

export async function deleteGalleryImage(id: string, imagePath: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('gallery_images').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await removeImage(supabase, imagePath);

  revalidateSite();
  revalidatePath('/admin/gallery');
}

// ---------- 이용안내 및 주의사항 (FAQ 항목) ----------
export async function createFaqItem(data: { title: string; content: string; sortOrder: number }) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('faq_items').insert({
    title: data.title,
    content: data.content,
    sort_order: data.sortOrder,
  });

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/copy');
}

export async function updateFaqItem(
  id: string,
  data: { title: string; content: string; sort_order: number }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('faq_items')
    .update({ title: data.title, content: data.content, sort_order: data.sort_order })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/copy');
}

export async function deleteFaqItem(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('faq_items').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/copy');
}

// ---------- 고객 게시판(문의) ----------
export async function replyInquiry(id: string, reply: string) {
  await requireAdmin();
  // inquiries는 RLS 전면 차단 → 서비스롤로 접근
  const admin = createAdminClient();

  const trimmed = reply.trim();
  const { error } = await admin
    .from('inquiries')
    .update({
      reply: trimmed || null,
      replied_at: trimmed ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/inquiries');
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('inquiries').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/inquiries');
}

// ---------- 케노피 실시간 예약 ----------
// 상품 타입(zone_type)별로 슬롯 번호(1~N) 체계가 독립적이므로 반드시 zoneType으로 필터링.
export async function listCabanaReservationsForDate(date: string, zoneType: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('cabana_reservations')
    .select('*')
    .eq('reservation_date', date)
    .eq('zone_type', zoneType)
    .order('cabana_no');

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 평상&케노피/그늘막평상/썬배드 각 상품 타입의 슬롯(개수) 수. cabana_zones.unit_count 기준.
// 마이그레이션 전이거나 데이터가 없으면 기존에 쓰던 기본값(60/18/40)으로 안전하게 대체.
export async function getCabanaZoneSlotCounts(): Promise<Record<string, number>> {
  await requireAdmin();
  const admin = createAdminClient();

  const counts: Record<string, number> = { 케노피: 60, 그늘막평상: 18, 썬배드: 40 };
  const { data } = await admin.from('cabana_zones').select('zone_type, unit_count');
  for (const z of data ?? []) {
    if (z.zone_type) counts[z.zone_type] = z.unit_count;
  }
  return counts;
}

// 전화번호 뒷 4자리로 예약 검색 (날짜 상관없이 전체 기간 대상).
// 예약막기(is_blocked)는 phone이 빈 문자열이라 자연스럽게 검색 결과에서 제외됨.
export async function searchCabanaReservationsByPhone(last4: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const digits = last4.trim();
  if (!/^\d{4}$/.test(digits)) {
    throw new Error('전화번호 뒷 4자리 숫자 4개를 입력해주세요.');
  }

  const { data, error } = await admin
    .from('cabana_reservations')
    .select('*')
    .like('phone', `%${digits}`)
    .order('reservation_date', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 캘린더 대시보드용: 기간 내 날짜별 예약 건수
// 캘린더 대시보드 + 판매 현황용: 기간 내 날짜별 건수, 타임별 건수, 타임별 단가
export async function getCabanaMonthSummary(startDate: string, endDate: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: reservations, error }, { data: zones, error: zonesError }] = await Promise.all([
    admin
      .from('cabana_reservations')
      .select(
        'reservation_date, zone_type, time_type, discount_type, is_camping, is_blocked, is_no_show, price_override'
      )
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate),
    admin.from('cabana_zones').select('zone_type, time_type, weekday_price'),
  ]);

  if (error) throw new Error(error.message);
  if (zonesError) throw new Error(zonesError.message);

  // priceByType[zone_type][time_type] = 단가. 썬배드처럼 time_type이 없는(단일가격) 타입은
  // 주간/야간/종일 세 키 모두에 같은 값을 넣어, 어떤 time_type으로 조회해도 값이 나오게 함.
  const priceByType: Record<string, Record<string, number>> = {};
  for (const z of zones ?? []) {
    const zt = z.zone_type ?? '케노피';
    if (!priceByType[zt]) priceByType[zt] = {};
    if (z.time_type) {
      priceByType[zt][z.time_type] = z.weekday_price;
    } else {
      priceByType[zt].주간 = z.weekday_price;
      priceByType[zt].야간 = z.weekday_price;
      priceByType[zt].종일 = z.weekday_price;
    }
  }

  const dateCounts: Record<string, number> = {};
  const byType: Record<string, { count: number; revenue: number }> = {
    주간: { count: 0, revenue: 0 },
    야간: { count: 0, revenue: 0 },
    종일: { count: 0, revenue: 0 },
  };
  const byCategory: Record<string, { count: number; revenue: number }> = {
    일반: { count: 0, revenue: 0 },
    단체: { count: 0, revenue: 0 },
    '장애인/유공자': { count: 0, revenue: 0 },
  };
  const camping = { count: 0, revenue: 0 };
  const sunbed = { count: 0, revenue: 0 };
  // 노쇼(미방문): 판매 집계에서 제외하되, 몇 건·얼마가 빠졌는지 별도로 집계해 보여준다.
  const noShow = { count: 0, revenue: 0 };

  for (const r of reservations ?? []) {
    if (r.is_blocked) continue; // 예약막기로 잠긴 슬롯은 매출/건수 통계에서 제외

    dateCounts[r.reservation_date] = (dateCounts[r.reservation_date] ?? 0) + 1;

    const multiplier = DISCOUNT_MULTIPLIER[(r.discount_type as DiscountType) ?? '일반'] ?? 1;
    const basePrice = priceByType[r.zone_type]?.[r.time_type] ?? 0;
    const revenue = r.price_override ?? basePrice * multiplier;

    // 노쇼는 매출·건수(타임별/구분별/캠핑/썬배드)에 반영하지 않고 노쇼 집계로만 잡는다.
    if (r.is_no_show) {
      noShow.count += 1;
      noShow.revenue += revenue;
      continue;
    }

    if (r.is_camping) {
      camping.count += 1;
      camping.revenue += revenue;
    }

    // 썬배드는 시간대별 가격 구분이 없는 단일 부속상품이라 타임별/구분별 표에 섞지 않고
    // 대시보드에 별도 섹션으로 표시
    if (r.zone_type === '썬배드') {
      sunbed.count += 1;
      sunbed.revenue += revenue;
      continue;
    }

    if (r.time_type in byType) {
      byType[r.time_type].count += 1;
      byType[r.time_type].revenue += revenue;
    }
    const category = r.discount_type && r.discount_type in byCategory ? r.discount_type : '일반';
    byCategory[category].count += 1;
    byCategory[category].revenue += revenue;
  }

  return { dateCounts, byType, byCategory, camping, sunbed, noShow, priceByType };
}

// zones 목록으로 priceByType[zone_type][time_type] = 단가 맵을 만든다. (썬배드류는 세 타임 동일)
function buildPriceByType(
  zones: { zone_type: string; time_type: string | null; weekday_price: number }[] | null
) {
  const priceByType: Record<string, Record<string, number>> = {};
  for (const z of zones ?? []) {
    const zt = z.zone_type ?? '케노피';
    if (!priceByType[zt]) priceByType[zt] = {};
    if (z.time_type) priceByType[zt][z.time_type] = z.weekday_price;
    else {
      priceByType[zt].주간 = z.weekday_price;
      priceByType[zt].야간 = z.weekday_price;
      priceByType[zt].종일 = z.weekday_price;
    }
  }
  return priceByType;
}

// 방문/매출 현황 달력용: 기간 내 날짜별 총 예약수/방문완료수/확정매출(방문완료만).
export async function getCabanaSalesCalendar(startDate: string, endDate: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: reservations }, { data: zones }] = await Promise.all([
    admin
      .from('cabana_reservations')
      .select(
        'reservation_date, zone_type, time_type, discount_type, is_blocked, is_no_show, is_visited, price_override'
      )
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate),
    admin.from('cabana_zones').select('zone_type, time_type, weekday_price'),
  ]);

  const priceByType = buildPriceByType(zones);
  const perDate: Record<string, { total: number; visited: number; revenue: number }> = {};

  for (const r of reservations ?? []) {
    if (r.is_blocked) continue;
    const d = (perDate[r.reservation_date] ??= { total: 0, visited: 0, revenue: 0 });
    d.total += 1;
    if (r.is_visited && !r.is_no_show) {
      const multiplier = DISCOUNT_MULTIPLIER[(r.discount_type as DiscountType) ?? '일반'] ?? 1;
      const basePrice = priceByType[r.zone_type]?.[r.time_type] ?? 0;
      d.visited += 1;
      d.revenue += r.price_override ?? basePrice * multiplier;
    }
  }

  return perDate;
}

export type DailySalesItem = {
  id: string;
  zoneType: string;
  zoneLabel: string;
  timeType: string;
  hasTimeType: boolean;
  cabanaNo: number;
  name: string;
  phone: string;
  guestCount: number;
  price: number;
  status: 'visited' | 'noShow' | 'pending';
  isCamping: boolean;
};

// 특정 날짜의 예약 리스트 + 상태별 집계 + 상품별 확정매출(방문완료 기준).
export async function getCabanaDailySales(date: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: reservations }, { data: zones }] = await Promise.all([
    admin
      .from('cabana_reservations')
      .select(
        'id, zone_type, time_type, cabana_no, name, phone, guest_count, discount_type, is_camping, is_blocked, is_no_show, is_visited, price_override'
      )
      .eq('reservation_date', date)
      .order('zone_type')
      .order('cabana_no'),
    admin.from('cabana_zones').select('zone_type, time_type, weekday_price'),
  ]);

  const priceByType = buildPriceByType(zones);

  const items: DailySalesItem[] = [];
  const visited = { count: 0, revenue: 0 };
  const noShow = { count: 0, revenue: 0 };
  const pending = { count: 0, revenue: 0 };
  const byZone: Record<string, { count: number; revenue: number }> = {};
  for (const zt of ZONE_TYPES) byZone[zt] = { count: 0, revenue: 0 };

  for (const r of reservations ?? []) {
    if (r.is_blocked) continue;

    const multiplier = DISCOUNT_MULTIPLIER[(r.discount_type as DiscountType) ?? '일반'] ?? 1;
    const basePrice = priceByType[r.zone_type]?.[r.time_type] ?? 0;
    const price = r.price_override ?? basePrice * multiplier;
    const status: DailySalesItem['status'] = r.is_no_show
      ? 'noShow'
      : r.is_visited
        ? 'visited'
        : 'pending';

    items.push({
      id: r.id,
      zoneType: r.zone_type,
      zoneLabel: ZONE_TYPE_LABELS[r.zone_type as ZoneType] ?? r.zone_type,
      timeType: r.time_type,
      hasTimeType: r.zone_type !== '썬배드',
      cabanaNo: r.cabana_no,
      name: r.name,
      phone: r.phone,
      guestCount: r.guest_count,
      price,
      status,
      isCamping: r.is_camping,
    });

    if (status === 'visited') {
      visited.count += 1;
      visited.revenue += price;
      const z = byZone[r.zone_type] ?? (byZone[r.zone_type] = { count: 0, revenue: 0 });
      z.count += 1;
      z.revenue += price;
    } else if (status === 'noShow') {
      noShow.count += 1;
      noShow.revenue += price;
    } else {
      pending.count += 1;
      pending.revenue += price;
    }
  }

  return { items, visited, noShow, pending, byZone };
}

function generateReservationNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${cleanDate}${randomStr}`;
}

async function getZoneSlotCount(
  admin: ReturnType<typeof createAdminClient>,
  zoneType: string
): Promise<number> {
  const { data } = await admin
    .from('cabana_zones')
    .select('unit_count')
    .eq('zone_type', zoneType)
    .limit(1)
    .maybeSingle();
  return data?.unit_count ?? 60;
}

export async function createCabanaReservationAdmin(data: {
  reservation_date: string;
  zone_type: string;
  cabana_no: number;
  time_type: string;
  name: string;
  phone: string;
  guest_count: number;
  is_camping: boolean;
  has_admission: boolean;
  discount_type: DiscountType;
  price_override?: number | null;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const slotCount = await getZoneSlotCount(admin, data.zone_type);
  if (!Number.isInteger(data.cabana_no) || data.cabana_no < 1 || data.cabana_no > slotCount) {
    throw new Error(`번호는 1~${slotCount} 사이로 입력해주세요.`);
  }
  if (!data.name.trim()) throw new Error('예약자 성함을 입력해주세요.');
  if (!data.phone.trim()) throw new Error('연락처를 입력해주세요.');

  const { data: others } = await admin
    .from('cabana_reservations')
    .select('time_type')
    .eq('reservation_date', data.reservation_date)
    .eq('zone_type', data.zone_type)
    .eq('cabana_no', data.cabana_no);

  const conflict = (others ?? []).some(
    (r) => r.time_type === '종일' || data.time_type === '종일' || r.time_type === data.time_type
  );
  if (conflict) {
    throw new Error(`${data.cabana_no}번은 해당 타임에 이미 예약이 있습니다.`);
  }

  const { error } = await admin.from('cabana_reservations').insert({
    reservation_no: generateReservationNo(data.reservation_date),
    reservation_date: data.reservation_date,
    zone_type: data.zone_type,
    cabana_no: data.cabana_no,
    time_type: data.time_type,
    name: data.name.trim(),
    phone: data.phone.trim(),
    guest_count: data.guest_count,
    is_camping: data.is_camping,
    has_admission: data.is_camping ? true : data.has_admission,
    discount_type: data.discount_type,
    price_override: data.price_override ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/cabana-reservations');
}

export async function updateCabanaReservation(
  id: string,
  data: {
    name: string;
    phone: string;
    guest_count: number;
    time_type: string;
    is_camping: boolean;
    has_admission: boolean;
    cabana_no: number;
    discount_type: DiscountType;
    price_override?: number | null;
    is_no_show?: boolean;
    is_visited?: boolean;
  }
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: current, error: fetchError } = await admin
    .from('cabana_reservations')
    .select('reservation_date, cabana_no, zone_type')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !current) throw new Error('예약을 찾을 수 없습니다.');

  const zoneType = current.zone_type ?? '케노피';
  const slotCount = await getZoneSlotCount(admin, zoneType);
  if (!Number.isInteger(data.cabana_no) || data.cabana_no < 1 || data.cabana_no > slotCount) {
    throw new Error(`번호는 1~${slotCount} 사이로 입력해주세요.`);
  }

  const oldCabanaNo = current.cabana_no;
  const cabanaNoChanged = oldCabanaNo !== data.cabana_no;

  const { data: targetOthers } = await admin
    .from('cabana_reservations')
    .select('id, time_type')
    .eq('reservation_date', current.reservation_date)
    .eq('zone_type', zoneType)
    .eq('cabana_no', data.cabana_no)
    .neq('id', id);

  const conflictsAtTarget = (targetOthers ?? []).filter(
    (r) => r.time_type === '종일' || data.time_type === '종일' || r.time_type === data.time_type
  );

  if (conflictsAtTarget.length > 0) {
    if (!cabanaNoChanged) {
      // 같은 자리 안에서 타임만 바꾸는 경우엔 자리를 맞바꿀 대상이 없으므로 그대로 차단
      throw new Error(`${data.cabana_no}번은 해당 타임에 이미 다른 예약이 있습니다.`);
    }

    // 번호를 바꾸는 경우: 대상 자리의 충돌 예약을 원래 번호로 맞바꿈(스왑)
    const { data: remainingAtOld } = await admin
      .from('cabana_reservations')
      .select('time_type')
      .eq('reservation_date', current.reservation_date)
      .eq('zone_type', zoneType)
      .eq('cabana_no', oldCabanaNo)
      .neq('id', id);

    const wouldConflictAfterSwap = conflictsAtTarget.some((moved) =>
      (remainingAtOld ?? []).some(
        (r) => r.time_type === '종일' || moved.time_type === '종일' || r.time_type === moved.time_type
      )
    );

    if (wouldConflictAfterSwap) {
      throw new Error(
        `${data.cabana_no}번과 ${oldCabanaNo}번 예약을 자동으로 맞바꿀 수 없습니다 (이동 후에도 시간대가 겹칩니다). 먼저 수동으로 정리해주세요.`
      );
    }

    for (const row of conflictsAtTarget) {
      const { error: swapError } = await admin
        .from('cabana_reservations')
        .update({ cabana_no: oldCabanaNo })
        .eq('id', row.id);
      if (swapError) throw new Error(swapError.message);
    }
  }

  const { error } = await admin
    .from('cabana_reservations')
    .update({
      name: data.name,
      phone: data.phone,
      guest_count: data.guest_count,
      time_type: data.time_type,
      is_camping: data.is_camping,
      has_admission: data.is_camping ? true : data.has_admission,
      cabana_no: data.cabana_no,
      discount_type: data.discount_type,
      price_override: data.price_override ?? null,
      is_no_show: data.is_no_show ?? false,
      is_visited: data.is_visited ?? false,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/cabana-reservations');
}

export async function cancelCabanaReservation(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('cabana_reservations').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/cabana-reservations');
}

function generateBlockNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `B${cleanDate}${randomStr}`;
}

// 예약막기: 실제 고객 예약 없이 특정 케노피·타임을 비워두지 못하게 잠금 처리.
// 여러 케노피 번호 × 여러 타임을 한 번에 선택해 일괄 차단할 수 있음(이미 예약/차단된
// 슬롯은 건너뛰고 나머지만 처리).
export async function blockCabanaSlots(
  reservationDate: string,
  zoneType: string,
  cabanaNos: number[],
  timeTypes: string[]
): Promise<{ blocked: number; skipped: number }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('cabana_reservations')
    .select('cabana_no, time_type')
    .eq('reservation_date', reservationDate)
    .eq('zone_type', zoneType)
    .in('cabana_no', cabanaNos);

  const occupied = existing ?? [];
  let blocked = 0;
  let skipped = 0;

  for (const cabanaNo of cabanaNos) {
    for (const timeType of timeTypes) {
      const conflict = occupied.some(
        (r) =>
          r.cabana_no === cabanaNo &&
          (r.time_type === '종일' || timeType === '종일' || r.time_type === timeType)
      );
      if (conflict) {
        skipped += 1;
        continue;
      }

      const { error } = await admin.from('cabana_reservations').insert({
        reservation_no: generateBlockNo(reservationDate),
        reservation_date: reservationDate,
        zone_type: zoneType,
        cabana_no: cabanaNo,
        time_type: timeType,
        name: '예약 차단',
        phone: '',
        guest_count: 0,
        is_camping: false,
        has_admission: false,
        discount_type: '일반',
        is_blocked: true,
      });

      // 사전에 충돌 여부를 이미 확인했으므로, 여기서 발생하는 오류는 "이미 예약됨"이
      // 아니라 실제 DB 오류(예: 마이그레이션 미실행)이므로 조용히 건너뛰지 않고 그대로 던짐
      if (error) throw new Error(error.message);
      blocked += 1;
      occupied.push({ cabana_no: cabanaNo, time_type: timeType });
    }
  }

  revalidatePath('/admin/cabana-reservations');
  return { blocked, skipped };
}

// 요금표에서 zone_type의 슬롯 수와 단일가격(썬배드류: time_type이 없는) 여부를 조회.
async function getZoneMeta(
  admin: ReturnType<typeof createAdminClient>,
  zoneType: string
): Promise<{ slotCount: number; singlePrice: boolean }> {
  const { data } = await admin
    .from('cabana_zones')
    .select('unit_count, time_type')
    .eq('zone_type', zoneType);
  const rows = data ?? [];
  const defaults: Record<string, number> = { 케노피: 60, 그늘막평상: 18, 썬배드: 40 };
  return {
    slotCount: rows[0]?.unit_count ?? defaults[zoneType] ?? 60,
    singlePrice: rows.length > 0 && rows.every((r) => r.time_type === null),
  };
}

// 일자 전체 예약막기 패널용: 해당 날짜에 상품 타입별로 관리자 예약막기가 걸린 슬롯 수와
// 전체 슬롯 수를 반환. blocked > 0이면 그 타입은 "막힘" 상태로 표시된다.
export async function getCabanaBlockStatusForDate(
  date: string
): Promise<Record<string, { blocked: number; slotCount: number }>> {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: zones }, { data: blocks }] = await Promise.all([
    admin.from('cabana_zones').select('zone_type, unit_count'),
    admin
      .from('cabana_reservations')
      .select('zone_type, cabana_no')
      .eq('reservation_date', date)
      .eq('is_blocked', true),
  ]);

  const defaults: Record<string, number> = { 케노피: 60, 그늘막평상: 18, 썬배드: 40 };
  const slotCount: Record<string, number> = {};
  for (const z of zones ?? []) slotCount[z.zone_type] = z.unit_count;

  const blockedSlots: Record<string, Set<number>> = {};
  for (const b of blocks ?? []) (blockedSlots[b.zone_type] ??= new Set()).add(b.cabana_no);

  const result: Record<string, { blocked: number; slotCount: number }> = {};
  for (const zt of ZONE_TYPES) {
    result[zt] = {
      blocked: blockedSlots[zt]?.size ?? 0,
      slotCount: slotCount[zt] ?? defaults[zt] ?? 0,
    };
  }
  return result;
}

// 특정 날짜·상품 타입의 남은 자리를 모두 예약막기. 이미 예약/차단된 슬롯은 건너뛴다.
// 평상류는 주간+야간을 막아 사실상 종일까지 봉쇄하고, 썬배드류(단일가격)는 종일만 막는다.
export async function blockAllCabanaSlotsForDate(
  date: string,
  zoneType: string
): Promise<{ blocked: number }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { slotCount, singlePrice } = await getZoneMeta(admin, zoneType);
  const timeTypes = singlePrice ? ['종일'] : ['주간', '야간'];

  const { data: existing } = await admin
    .from('cabana_reservations')
    .select('cabana_no, time_type')
    .eq('reservation_date', date)
    .eq('zone_type', zoneType);

  const occupied = existing ?? [];
  const rows: Database['public']['Tables']['cabana_reservations']['Insert'][] = [];
  const usedNos = new Set<string>();

  for (let cabanaNo = 1; cabanaNo <= slotCount; cabanaNo++) {
    for (const timeType of timeTypes) {
      const conflict = occupied.some(
        (r) =>
          r.cabana_no === cabanaNo &&
          (r.time_type === '종일' || timeType === '종일' || r.time_type === timeType)
      );
      if (conflict) continue;

      let reservationNo = generateBlockNo(date);
      while (usedNos.has(reservationNo)) reservationNo = generateBlockNo(date);
      usedNos.add(reservationNo);

      rows.push({
        reservation_no: reservationNo,
        reservation_date: date,
        zone_type: zoneType,
        cabana_no: cabanaNo,
        time_type: timeType,
        name: '예약 차단',
        phone: '',
        guest_count: 0,
        is_camping: false,
        has_admission: false,
        discount_type: '일반',
        is_blocked: true,
      });
      occupied.push({ cabana_no: cabanaNo, time_type: timeType });
    }
  }

  if (rows.length > 0) {
    const { error } = await admin.from('cabana_reservations').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/cabana-reservations');
  return { blocked: rows.length };
}

// 특정 날짜·상품 타입의 예약막기(is_blocked)만 모두 해제. 실제 고객 예약은 건드리지 않는다.
export async function unblockAllCabanaSlotsForDate(
  date: string,
  zoneType: string
): Promise<{ removed: number }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('cabana_reservations')
    .delete()
    .eq('reservation_date', date)
    .eq('zone_type', zoneType)
    .eq('is_blocked', true)
    .select('id');

  if (error) throw new Error(error.message);

  revalidatePath('/admin/cabana-reservations');
  return { removed: data?.length ?? 0 };
}

// ---------- 관리자 사용자 관리 (슈퍼 관리자 전용) ----------
export async function listAdminUsers() {
  const { isSuperAdmin } = await requireAdmin();
  if (!isSuperAdmin) throw new Error('권한이 없습니다.');

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('admin_users')
    .select('*')
    .order('created_at');
  if (error) throw new Error(error.message);

  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) throw new Error(authError.message);
  const emailMap = new Map(authData.users.map((u) => [u.id, u.email ?? '']));

  return (rows ?? []).map((r) => ({
    userId: r.user_id,
    email: emailMap.get(r.user_id) ?? '(알 수 없음)',
    isSuperAdmin: r.is_super_admin ?? true,
    permissions: r.permissions ?? [],
    createdAt: r.created_at,
  }));
}

export async function createRestrictedAdmin(
  email: string,
  password: string,
  permissions: string[]
) {
  const { isSuperAdmin } = await requireAdmin();
  if (!isSuperAdmin) throw new Error('권한이 없습니다.');

  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error('이메일을 입력해주세요.');
  if (password.length < 6) throw new Error('비밀번호는 6자 이상 입력해주세요.');
  if (permissions.length === 0) throw new Error('최소 1개 이상의 관리 항목을 선택해주세요.');

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);

  const { error: insertError } = await admin.from('admin_users').insert({
    user_id: data.user.id,
    is_super_admin: false,
    permissions,
  });
  if (insertError) {
    // admin_users 등록 실패 시 방금 만든 인증 계정도 함께 정리
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(insertError.message);
  }

  revalidatePath('/admin/users');
}

export async function updateAdminPermissions(userId: string, permissions: string[]) {
  const { isSuperAdmin } = await requireAdmin();
  if (!isSuperAdmin) throw new Error('권한이 없습니다.');

  const admin = createAdminClient();

  const { data: target } = await admin
    .from('admin_users')
    .select('is_super_admin')
    .eq('user_id', userId)
    .maybeSingle();
  if (target?.is_super_admin) throw new Error('최고 관리자의 권한은 수정할 수 없습니다.');

  const { error } = await admin
    .from('admin_users')
    .update({ permissions })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}

export async function deleteAdminUser(userId: string) {
  const { isSuperAdmin, user } = await requireAdmin();
  if (!isSuperAdmin) throw new Error('권한이 없습니다.');
  if (user.id === userId) throw new Error('본인 계정은 삭제할 수 없습니다.');

  const admin = createAdminClient();

  const { data: target } = await admin
    .from('admin_users')
    .select('is_super_admin')
    .eq('user_id', userId)
    .maybeSingle();
  if (target?.is_super_admin) throw new Error('최고 관리자 계정은 삭제할 수 없습니다.');

  const { error: deleteRowError } = await admin
    .from('admin_users')
    .delete()
    .eq('user_id', userId);
  if (deleteRowError) throw new Error(deleteRowError.message);

  await admin.auth.admin.deleteUser(userId);

  revalidatePath('/admin/users');
}

// ---------- 카카오톡 알림 연동 ----------
export async function saveKakaoSettings(
  restApiKey: string,
  clientSecret: string,
  redirectUri: string
) {
  await requirePagePermission('kakao');
  await saveKakaoConfig(restApiKey.trim(), clientSecret.trim(), redirectUri.trim());
  revalidatePath('/admin/kakao');
}

export async function disconnectKakaoAction() {
  await requirePagePermission('kakao');
  await disconnectKakao();
  revalidatePath('/admin/kakao');
}

export async function sendKakaoTestMessageAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  await requirePagePermission('kakao');
  try {
    await sendKakaoTestMessage();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '발송 중 오류가 발생했습니다.' };
  }
}

// ---------- 고객 알림톡(알리고) 연동 ----------
export async function saveAligoSettings(config: {
  apiKey: string;
  userId: string;
  sender: string;
  senderKey: string;
  tplCode: string;
  messageTemplate: string;
  useSmsFallback: boolean;
}) {
  await requirePagePermission('aligo');
  await saveAligoConfig({
    apiKey: config.apiKey.trim(),
    userId: config.userId.trim(),
    sender: config.sender.trim(),
    senderKey: config.senderKey.trim(),
    tplCode: config.tplCode.trim(),
    messageTemplate: config.messageTemplate,
    useSmsFallback: config.useSmsFallback,
  });
  revalidatePath('/admin/aligo');
}

export async function sendAligoTestMessageAction(
  testPhone: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePagePermission('aligo');
  try {
    await sendAligoTestMessage(testPhone.trim());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '발송 중 오류가 발생했습니다.' };
  }
}

// ---------- 인증 ----------
export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
