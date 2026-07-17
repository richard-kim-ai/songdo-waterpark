import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const BUCKET = 'site-images';

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  file: File,
  folder: 'popups' | 'gallery' | 'site' | 'board'
) {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    // 파일명이 UUID라 내용이 바뀌면 경로도 바뀜(불변) → 1년 캐시로 재방문 트래픽 절감
    cacheControl: '31536000',
  });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  return path;
}

export async function removeImage(supabase: SupabaseClient<Database>, path: string | null) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
