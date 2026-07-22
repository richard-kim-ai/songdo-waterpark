import { requirePagePermission } from '@/lib/admin/auth';
import SettingsEditor from '../SettingsEditor';

export default async function CopyAdminPage() {
  const { supabase } = await requirePagePermission('copy');
  const [{ data: settings }, { data: faqItems }] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('faq_items').select('*').order('sort_order'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">카피 수정</h1>
      <p className="text-gray-500 mb-6">
        메인 화면, 중간 배너, 이용시간 안내, 안전수칙 상단, 푸터에 들어가는 문구를 한 곳에서
        수정합니다.
      </p>
      <SettingsEditor settings={settings ?? []} faqItems={faqItems ?? []} />
    </div>
  );
}
