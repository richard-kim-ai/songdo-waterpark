import { createClient } from '@/lib/supabase/server';
import SettingsEditor from '../SettingsEditor';

export default async function CopyAdminPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('site_settings').select('*');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">카피 수정</h1>
      <p className="text-gray-500 mb-6">
        메인 화면, 중간 배너, 이용시간 안내, 안전수칙 상단, 푸터에 들어가는 문구를 한 곳에서
        수정합니다.
      </p>
      <SettingsEditor settings={settings ?? []} />
    </div>
  );
}
