import { cache } from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site';
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

// generateMetadata와 페이지 렌더가 같은 요청 내에서 DB를 한 번만 조회하도록 캐시.
const getData = cache(async function getData() {
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
    supabase.from('ticket_types').select('*').eq('is_active', true).order('sort_order'),
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
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getData();
  const siteImages = resolveSiteImages(settings);
  const ogImage = siteImages.hero || siteImages.logo;

  return {
    openGraph: ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }] } : {},
    twitter: ogImage ? { images: [ogImage] } : {},
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

  // 구글 리치 결과용 구조화 데이터(schema.org) — 지역 물놀이 시설 정보
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AmusementPark',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: siteImages.hero || siteImages.logo || undefined,
    ...(settings.footer_phone ? { telephone: settings.footer_phone } : {}),
    ...(settings.footer_email ? { email: settings.footer_email } : {}),
    ...(settings.footer_address
      ? {
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'KR',
            addressLocality: '인천광역시',
            streetAddress: settings.footer_address,
          },
        }
      : {}),
    ...(settings.pool_weekday_hours
      ? {
          openingHours: `Mo-Su ${settings.pool_weekday_hours.replace(/\s*~\s*/, '-')}`,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          ctaCampingLabel={settings.hero_cta_camping_label ?? ''}
          ctaCampingUrl={settings.hero_cta_camping_url ?? ''}
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
          squirrelTubUrl={siteImages.squirrel_tub}
          sectionTitle={settings.facilities_title ?? ''}
          sectionSubtitle={settings.facilities_subtitle ?? ''}
          rideButtonLabel={settings.facilities_ride_button_label ?? ''}
        />
        <Cabana
          zones={zones}
          sectionTitle={settings.cabana_title ?? ''}
          sectionSubtitle={settings.cabana_subtitle ?? ''}
          diagramTitle={settings.cabana_diagram_title ?? ''}
          tableTitle={settings.cabana_table_title ?? ''}
          noticeTitle={settings.cabana_notice_title ?? ''}
          cabanaNotice={settings.cabana_notice ?? ''}
          diagramUrl={siteImages.layout_cabana}
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
        <InfoNotice
          settings={settings}
          tickets={tickets}
          parkingImageUrl={siteImages.parking_info}
        />
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
