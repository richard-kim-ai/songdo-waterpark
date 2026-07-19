'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImage, removeImage } from '@/lib/admin/storage';
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
export async function listCabanaReservationDateCounts(startDate: string, endDate: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('cabana_reservations')
    .select('reservation_date')
    .gte('reservation_date', startDate)
    .lte('reservation_date', endDate);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.reservation_date] = (counts[row.reservation_date] ?? 0) + 1;
  }
  return counts;
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

// ---------- 인증 ----------
export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
