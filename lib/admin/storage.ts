import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const BUCKET = 'site-images';

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  file: File,
  folder: 'popups' | 'gallery' | 'site'
) {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
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
