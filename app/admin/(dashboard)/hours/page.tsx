import { createClient } from '@/lib/supabase/server';
import SettingsEditor from '../SettingsEditor';

export default async function HoursAdminPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('site_settings').select('*');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">이용시간 텍스트 관리</h1>
      <SettingsEditor settings={settings ?? []} />
    </div>
  );
}
