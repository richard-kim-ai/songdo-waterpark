import { createClient } from '@/lib/supabase/server';
import TicketEditor from '../TicketEditor';

export default async function TicketsAdminPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('ticket_types')
    .select('*')
    .in('category', ['general', 'family_package'])
    .order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">입장권 및 링크 관리</h1>
      <TicketEditor tickets={tickets ?? []} />
    </div>
  );
}
