import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Pricing from '@/components/Pricing';
import Facilities from '@/components/Facilities';
import Cabana from '@/components/Cabana';
import FacilityLayout from '@/components/FacilityLayout';
import InfoNotice from '@/components/InfoNotice';
import SafetyRules from '@/components/SafetyRules';
import Gallery from '@/components/Gallery';
import FaqAccordion from '@/components/FaqAccordion';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import PopupModal from '@/components/PopupModal';
import { resolveSiteImages } from '@/lib/images';
import type { Database } from '@/types/database';

export const revalidate = 60; // 요금표는 1분마다 재검증

type TicketType = Database['public']['Tables']['ticket_types']['Row'];
type CabanaZone = Database['public']['Tables']['cabana_zones']['Row'];
type Popup = Database['public']['Tables']['popups']['Row'];
type GalleryImage = Database['public']['Tables']['gallery_images']['Row'];

async function getData() {
  // Supabase 환경변수가 아직 설정되지 않았다면 빈 배열을 반환합니다.
  // (개발 초기 단계에서도 npm run dev가 에러 없이 동작하도록 하는 안전장치)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      tickets: [] as TicketType[],
      zones: [] as CabanaZone[],
      settings: {} as Record<string, string>,
      popups: [] as Popup[],
      galleryImages: [] as GalleryImage[],
    };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: tickets },
    { data: zones },
    { data: settingsRows },
    { data: popups },
    { data: galleryImages },
  ] = await Promise.all([
    supabase.from('ticket_types').select('*').order('sort_order'),
    supabase.from('cabana_zones').select('*').order('sort_order'),
    supabase.from('site_settings').select('*'),
    supabase
      .from('popups')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('sort_order'),
    supabase.from('gallery_images').select('*').order('sort_order'),
  ]);

  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));

  return {
    tickets: tickets ?? [],
    zones: zones ?? [],
    settings,
    popups: popups ?? [],
    galleryImages: galleryImages ?? [],
  };
}

export default async function Home() {
  const { tickets, zones, settings, popups, galleryImages } = await getData();
  const siteImages = resolveSiteImages(settings);

  return (
    <>
      <PopupModal popups={popups} />
      <Header logoUrl={siteImages.logo} />
      <main>
        <Hero heroUrl={siteImages.hero} />
        <Pricing tickets={tickets} />
        <Facilities tickets={tickets} trainUrl={siteImages.train} carUrl={siteImages.car} />
        <Cabana
          zones={zones}
          cabanaNotice={settings.cabana_notice ?? ''}
          diagramUrl={siteImages.cabana_diagram}
        />
        <FacilityLayout masterUrl={siteImages.layout_master} cabanaUrl={siteImages.layout_cabana} />
        <InfoNotice settings={settings} tickets={tickets} />
        <SafetyRules imageUrl={siteImages.safety_rules} />
        <Gallery images={galleryImages} />
        <FaqAccordion />
      </main>
      <Footer logoUrl={siteImages.logo} mapUrl={siteImages.map} />
      <MobileNav />
    </>
  );
}
