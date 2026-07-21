'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requirePagePermission } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImage, removeImage } from '@/lib/admin/storage';
import { DISCOUNT_MULTIPLIER, type DiscountType } from '@/lib/cabana-pricing';
import { saveKakaoConfig, disconnectKakao, sendKakaoTestMessage } from '@/lib/kakao';
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
export async function listCabanaReservationsForDate(date: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('cabana_reservations')
    .select('*')
    .eq('reservation_date', date)
    .order('cabana_no');

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
      .select('reservation_date, time_type, discount_type, is_camping')
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate),
    admin.from('cabana_zones').select('name, weekday_price').order('sort_order').limit(3),
  ]);

  if (error) throw new Error(error.message);
  if (zonesError) throw new Error(zonesError.message);

  // cabana_zones는 정렬 순서상 [주간, 야간, 종일, 썬배드] 순으로 등록되어 있음 (Cabana.tsx와 동일한 규칙)
  const zoneList = zones ?? [];
  const priceByType: Record<string, number> = {
    주간: zoneList[0]?.weekday_price ?? 0,
    야간: zoneList[1]?.weekday_price ?? 0,
    종일: zoneList[2]?.weekday_price ?? 0,
  };

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

  for (const r of reservations ?? []) {
    dateCounts[r.reservation_date] = (dateCounts[r.reservation_date] ?? 0) + 1;

    const multiplier = DISCOUNT_MULTIPLIER[(r.discount_type as DiscountType) ?? '일반'] ?? 1;
    const revenue = (priceByType[r.time_type] ?? 0) * multiplier;

    if (r.time_type in byType) {
      byType[r.time_type].count += 1;
      byType[r.time_type].revenue += revenue;
    }
    const category = r.discount_type && r.discount_type in byCategory ? r.discount_type : '일반';
    byCategory[category].count += 1;
    byCategory[category].revenue += revenue;

    if (r.is_camping) {
      camping.count += 1;
      camping.revenue += revenue;
    }
  }

  return { dateCounts, byType, byCategory, camping, priceByType };
}

function generateReservationNo(dateStr: string) {
  const cleanDate = dateStr.replace(/-/g, '').slice(2);
  const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${cleanDate}${randomStr}`;
}

export async function createCabanaReservationAdmin(data: {
  reservation_date: string;
  cabana_no: number;
  time_type: string;
  name: string;
  phone: string;
  guest_count: number;
  is_camping: boolean;
  has_admission: boolean;
  discount_type: DiscountType;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!Number.isInteger(data.cabana_no) || data.cabana_no < 1 || data.cabana_no > 60) {
    throw new Error('케노피 번호는 1~60 사이로 입력해주세요.');
  }
  if (!data.name.trim()) throw new Error('예약자 성함을 입력해주세요.');
  if (!data.phone.trim()) throw new Error('연락처를 입력해주세요.');

  const { data: others } = await admin
    .from('cabana_reservations')
    .select('time_type')
    .eq('reservation_date', data.reservation_date)
    .eq('cabana_no', data.cabana_no);

  const conflict = (others ?? []).some(
    (r) => r.time_type === '종일' || data.time_type === '종일' || r.time_type === data.time_type
  );
  if (conflict) {
    throw new Error(`${data.cabana_no}번 케노피는 해당 타임에 이미 예약이 있습니다.`);
  }

  const { error } = await admin.from('cabana_reservations').insert({
    reservation_no: generateReservationNo(data.reservation_date),
    reservation_date: data.reservation_date,
    cabana_no: data.cabana_no,
    time_type: data.time_type,
    name: data.name.trim(),
    phone: data.phone.trim(),
    guest_count: data.guest_count,
    is_camping: data.is_camping,
    has_admission: data.is_camping ? true : data.has_admission,
    discount_type: data.discount_type,
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
  }
) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!Number.isInteger(data.cabana_no) || data.cabana_no < 1 || data.cabana_no > 60) {
    throw new Error('케노피 번호는 1~60 사이로 입력해주세요.');
  }

  const { data: current, error: fetchError } = await admin
    .from('cabana_reservations')
    .select('reservation_date')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !current) throw new Error('예약을 찾을 수 없습니다.');

  const { data: others } = await admin
    .from('cabana_reservations')
    .select('time_type')
    .eq('reservation_date', current.reservation_date)
    .eq('cabana_no', data.cabana_no)
    .neq('id', id);

  const conflict = (others ?? []).some(
    (r) => r.time_type === '종일' || data.time_type === '종일' || r.time_type === data.time_type
  );
  if (conflict) {
    throw new Error(`${data.cabana_no}번 케노피는 해당 타임에 이미 다른 예약이 있습니다.`);
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
export async function saveKakaoSettings(restApiKey: string, redirectUri: string) {
  await requirePagePermission('kakao');
  await saveKakaoConfig(restApiKey.trim(), redirectUri.trim());
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

// ---------- 인증 ----------
export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
