import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const BUCKET = 'site-images';
const FOLDERS = ['site', 'gallery', 'popups'] as const;

export type FolderUsage = { folder: string; count: number; bytes: number };
export type StorageUsage = { folders: FolderUsage[]; totalCount: number; totalBytes: number };

async function listFolder(
  supabase: SupabaseClient<Database>,
  prefix: string
): Promise<FolderUsage> {
  let count = 0;
  let bytes = 0;
  const pageSize = 100;
  let offset = 0;

  // 폴더 내 파일이 많을 수 있으므로 페이지네이션으로 전부 합산
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: pageSize, offset });
    if (error || !data || data.length === 0) break;

    for (const item of data) {
      // id가 null이면 하위 폴더 항목이므로 제외 (파일만 합산)
      const size = (item as { id: string | null; metadata?: { size?: number } });
      if (size.id && size.metadata?.size) {
        count += 1;
        bytes += size.metadata.size;
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return { folder: prefix || '(루트)', count, bytes };
}

export async function getStorageUsage(
  supabase: SupabaseClient<Database>
): Promise<StorageUsage> {
  const folders = await Promise.all([
    listFolder(supabase, ''), // 버킷 루트(레거시 기본 이미지)
    ...FOLDERS.map((f) => listFolder(supabase, f)),
  ]);

  const totalCount = folders.reduce((sum, f) => sum + f.count, 0);
  const totalBytes = folders.reduce((sum, f) => sum + f.bytes, 0);
  return { folders, totalCount, totalBytes };
}

export type RowCount = { table: string; label: string; count: number };

const COUNT_TABLES: { table: keyof Database['public']['Tables']; label: string }[] = [
  { table: 'popups', label: '팝업' },
  { table: 'gallery_images', label: '갤러리 이미지' },
  { table: 'ticket_types', label: '입장권·부속시설' },
  { table: 'cabana_zones', label: '케노피 구역' },
  { table: 'site_settings', label: '사이트 설정 항목' },
];

export async function getRowCounts(
  supabase: SupabaseClient<Database>
): Promise<RowCount[]> {
  const results = await Promise.all(
    COUNT_TABLES.map(async ({ table, label }) => {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      return { table, label, count: count ?? 0 };
    })
  );
  return results;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
