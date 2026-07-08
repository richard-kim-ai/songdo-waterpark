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
import ScrollToTop from '@/components/ScrollToTop';
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

const FAQ_ITEM_COUNT = 5;

export default async function Home() {
  const { tickets, zones, settings, popups, galleryImages } = await getData();
  const siteImages = resolveSiteImages(settings);
  const faqItems = Array.from({ length: FAQ_ITEM_COUNT }, (_, i) => {
    const n = i + 1;
    return {
      title: settings[`faq_item_${n}_title`] ?? '',
      lines: (settings[`faq_item_${n}_lines`] ?? '').split('\n').filter((line) => line.trim()),
    };
  });

  return (
    <>
      <PopupModal popups={popups} />
      <Header
        logoUrl={siteImages.logo}
        navLabels={{
          pricing: settings.nav_pricing_label ?? '',
          cabana: settings.nav_cabana_label ?? '',
          facilities: settings.nav_facilities_label ?? '',
          info: settings.nav_info_label ?? '',
          gallery: settings.nav_gallery_label ?? '',
        }}
      />
      <main>
        <Hero
          heroUrl={siteImages.hero}
          title={settings.hero_title ?? ''}
          subtitle={settings.hero_subtitle ?? ''}
          ctaTicketLabel={settings.hero_cta_ticket_label ?? ''}
          ctaCabanaLabel={settings.hero_cta_cabana_label ?? ''}
        />
        <Pricing
          tickets={tickets}
          sectionTitle={settings.pricing_title ?? ''}
          sectionSubtitle={settings.pricing_subtitle ?? ''}
          poolSectionTitle={settings.pricing_pool_section_title ?? ''}
          purchaseNotice={settings.pricing_purchase_notice ?? ''}
          familySectionTitle={settings.pricing_family_section_title ?? ''}
          generalButtonLabel={settings.pricing_general_button_label ?? ''}
          familyButtonLabel={settings.pricing_family_button_label ?? ''}
          benefitTitle={settings.benefit_title ?? ''}
          benefitSubtitle={settings.benefit_subtitle ?? ''}
          benefitNote={settings.benefit_note ?? ''}
          seasonPassNotice={settings.pricing_season_notice ?? ''}
          entryLimitNotice={settings.pricing_entry_limit_notice ?? ''}
        />
        <Facilities
          tickets={tickets}
          trainUrl={siteImages.train}
          carUrl={siteImages.car}
          sectionTitle={settings.facilities_title ?? ''}
          sectionSubtitle={settings.facilities_subtitle ?? ''}
          packageDesc={settings.facilities_package_desc ?? ''}
          rideButtonLabel={settings.facilities_ride_button_label ?? ''}
          packageButtonLabel={settings.facilities_package_button_label ?? ''}
        />
        <Cabana
          zones={zones}
          sectionTitle={settings.cabana_title ?? ''}
          sectionSubtitle={settings.cabana_subtitle ?? ''}
          diagramTitle={settings.cabana_diagram_title ?? ''}
          tableTitle={settings.cabana_table_title ?? ''}
          noticeTitle={settings.cabana_notice_title ?? ''}
          cabanaNotice={settings.cabana_notice ?? ''}
          diagramUrl={siteImages.cabana_diagram}
          bookingUrl={settings.cabana_booking_url ?? ''}
          bookingButtonLabel={settings.cabana_booking_button_label ?? ''}
        />
        <FacilityLayout
          masterUrl={siteImages.layout_master}
          cabanaUrl={siteImages.layout_cabana}
          sectionTitle={settings.layout_title ?? ''}
          sectionSubtitle={settings.layout_subtitle ?? ''}
          tabTotalLabel={settings.layout_tab_total_label ?? ''}
          tabCabanaLabel={settings.layout_tab_cabana_label ?? ''}
        />
        <InfoNotice settings={settings} tickets={tickets} />
        <SafetyRules
          imageUrl={siteImages.safety_rules}
          title={settings.safety_title ?? ''}
          subtitle={settings.safety_subtitle ?? ''}
          bannerTitle={settings.safety_banner_title ?? ''}
          rulesText={settings.safety_rules_text ?? ''}
          extraTitle={settings.safety_extra_title ?? ''}
          extraItemsText={settings.safety_extra_items ?? ''}
        />
        <Gallery
          images={galleryImages}
          sectionTitle={settings.gallery_title ?? ''}
          sectionSubtitle={settings.gallery_subtitle ?? ''}
        />
        <FaqAccordion
          title={settings.faq_title ?? ''}
          subtitle={settings.faq_subtitle ?? ''}
          items={faqItems}
        />
      </main>
      <Footer
        logoUrl={siteImages.logo}
        mapUrl={siteImages.map}
        tagline={settings.footer_tagline ?? ''}
        addressTitle={settings.footer_address_title ?? ''}
        hoursTitle={settings.footer_hours_title ?? ''}
        termsLabel={settings.footer_terms_label ?? ''}
        privacyLabel={settings.footer_privacy_label ?? ''}
        address={settings.footer_address ?? ''}
        phone={settings.footer_phone ?? ''}
        email={settings.footer_email ?? ''}
        copyright={settings.footer_copyright ?? ''}
        poolSeason={settings.pool_season ?? ''}
        poolWeekdayHours={settings.pool_weekday_hours ?? ''}
        poolWeekendHours={settings.pool_weekend_hours ?? ''}
      />
      <MobileNav
        ticketLabel={settings.mobile_nav_ticket_label ?? ''}
        cabanaLabel={settings.mobile_nav_cabana_label ?? ''}
      />
      <ScrollToTop />
    </>
  );
}
