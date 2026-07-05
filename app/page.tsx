import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Pricing from '@/components/Pricing';
import Facilities from '@/components/Facilities';
import Cabana from '@/components/Cabana';
import SafetyRules from '@/components/SafetyRules';
import InfoNotice from '@/components/InfoNotice';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import type { Database } from '@/types/database';

export const revalidate = 60; // 요금표는 1분마다 재검증

type TicketType = Database['public']['Tables']['ticket_types']['Row'];
type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];

async function getData() {
  // Supabase 환경변수가 아직 설정되지 않았다면 빈 배열을 반환합니다.
  // (개발 초기 단계에서도 npm run dev가 에러 없이 동작하도록 하는 안전장치)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { tickets: [] as TicketType[], zones: [] as CabanaZone[] };
  }

  const supabase = createClient();

  const [{ data: tickets }, { data: zones }] = await Promise.all([
    supabase.from('ticket_types').select('*').order('sort_order'),
    supabase.from('cabana_zones').select('*').order('sort_order'),
  ]);

  return {
    tickets: tickets ?? [],
    zones: zones ?? [],
  };
}

export default async function Home() {
  const { tickets, zones } = await getData();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Pricing tickets={tickets} />
        <Facilities tickets={tickets} />
        <Cabana zones={zones} />
        <SafetyRules />
        <InfoNotice />
        <Gallery />
      </main>
      <Footer />
    </>
  );
}
