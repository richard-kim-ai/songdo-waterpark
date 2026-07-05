import { createClient } from '@/lib/supabase/server';
import PopupManager from '../PopupManager';

export default async function PopupsAdminPage() {
  const supabase = await createClient();
  const { data: popups } = await supabase.from('popups').select('*').order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">팝업 생성 관리</h1>
      <PopupManager popups={popups ?? []} />
    </div>
  );
}
