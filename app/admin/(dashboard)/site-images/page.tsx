import { requirePagePermission } from '@/lib/admin/auth';
import { resolveSiteImages } from '@/lib/images';
import SiteImageManager from '../SiteImageManager';

export default async function SiteImagesAdminPage() {
  const { supabase } = await requirePagePermission('site-images');
  const { data: settingsRows } = await supabase.from('site_settings').select('key,value');
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const siteImages = resolveSiteImages(settings);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">그외 이미지 관리</h1>
      <p className="text-gray-500 mb-6">
        로고, 메인 배경, 시설 배치도, 안전수칙 이미지 등 홈페이지 고정 이미지를 교체합니다.
        (포토갤러리 이미지는 &lsquo;포토갤러리 관리&rsquo; 메뉴에서 별도로 관리합니다.)
      </p>
      <SiteImageManager siteImages={siteImages} />
    </div>
  );
}
