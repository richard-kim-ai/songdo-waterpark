import { createClient } from '@/lib/supabase/server';
import CabanaEditor from '../CabanaEditor';

export default async function CabanaAdminPage() {
  const supabase = await createClient();
  const { data: zones } = await supabase.from('cabana_zones').select('*').order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">카바나 금액 수정</h1>
      <CabanaEditor zones={zones ?? []} />
    </div>
  );
}
