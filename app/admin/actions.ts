'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { uploadImage, removeImage } from '@/lib/admin/storage';
import type { Database } from '@/types/database';

function revalidateSite() {
  revalidatePath('/');
}

// ---------- 입장권 / 부속시설 ----------
export async function upsertTicket(
  id: string,
  data: { price: number; purchase_url: string | null; usage_hours: string | null }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('ticket_types')
    .update({
      price: data.price,
      purchase_url: data.purchase_url || null,
      usage_hours: data.usage_hours || null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidateSite();
  revalidatePath('/admin/tickets');
  revalidatePath('/admin/facilities');
}

// ---------- 카바나 구역 ----------
export async function upsertCabanaZone(
  id: string,
  data: { weekday_price: number; weekend_price: number; unit_count: number }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('cabana_zones')
    .update({
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
  revalidatePath('/admin/hours');
}

// ---------- 팝업 ----------
export async function createPopup(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get('title') ?? '');
  const linkUrl = String(formData.get('link_url') ?? '') || null;
  const isActive = formData.get('is_active') === 'on';
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
  const startDate = String(formData.get('start_date') ?? '') || null;
  const endDate = String(formData.get('end_date') ?? '') || null;
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const file = formData.get('image') as File | null;

  const update: Database['public']['Tables']['popups']['Update'] = {
    title,
    link_url: linkUrl,
    is_active: isActive,
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

// ---------- 인증 ----------
export async function signOutAdmin() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
