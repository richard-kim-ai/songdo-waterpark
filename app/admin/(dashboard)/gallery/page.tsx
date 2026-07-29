import { requirePagePermission } from '@/lib/admin/auth';
import GalleryManager from '../GalleryManager';

export default async function GalleryAdminPage() {
  const { supabase } = await requirePagePermission('gallery');
  const { data: images } = await supabase.from('gallery_images').select('*').order('sort_order');

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">포토갤러리 관리</h1>
      <GalleryManager images={images ?? []} />
    </div>
  );
}
