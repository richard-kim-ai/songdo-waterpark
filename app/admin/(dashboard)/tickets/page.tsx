import { requirePagePermission } from '@/lib/admin/auth';
import TicketEditor from '../TicketEditor';
import PricingButtonLabels from '../PricingButtonLabels';

export default async function TicketsAdminPage() {
  const { supabase } = await requirePagePermission('tickets');
  const [{ data: tickets }, { data: settingsRows }] = await Promise.all([
    supabase
      .from('ticket_types')
      .select('*')
      .in('category', ['general', 'family_package'])
      .order('sort_order'),
    supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['pricing_general_button_label', 'pricing_family_button_label']),
  ]);
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">입장권 및 링크 관리</h1>
      <TicketEditor tickets={tickets ?? []} />
      <PricingButtonLabels
        generalButtonLabel={settings.pricing_general_button_label ?? ''}
        familyButtonLabel={settings.pricing_family_button_label ?? ''}
      />
    </div>
  );
}
