import { createClient } from '@/lib/supabase/server';
import TicketEditor from '../TicketEditor';

export default async function FacilitiesAdminPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('category', 'attraction')
    .order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">부속시설 & 패키지 관리</h1>
      <p className="text-gray-500 mb-6">
        부속 놀이시설(신나는기차, 마이카)과 빅2 패키지의 가격, 이용시간, 구매 링크를 관리합니다.
      </p>
      <TicketEditor tickets={tickets ?? []} showUsageHours />
    </div>
  );
}
