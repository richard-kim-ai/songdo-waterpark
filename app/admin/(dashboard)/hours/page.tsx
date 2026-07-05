import { createClient } from '@/lib/supabase/server';
import SettingsEditor from '../SettingsEditor';

// 이용시간 안내에 해당하는 설정 키만 표시 (site_image_* 등 다른 설정은 제외)
const HOURS_KEYS = [
  'pool_season',
  'pool_weekday_hours',
  'pool_weekend_hours',
  'pool_last_entry',
  'cabana_open_hours',
  'cabana_usage_unit',
  'cabana_notice',
];

export default async function HoursAdminPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('site_settings').select('*').in('key', HOURS_KEYS);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">이용시간 텍스트 관리</h1>
      <SettingsEditor settings={settings ?? []} />
    </div>
  );
}
