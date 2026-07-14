'use client';

import { useState, useTransition } from 'react';
import { upsertSiteSetting } from '@/app/admin/actions';
import type { Database } from '@/types/database';

type SiteSetting = Database['public']['Tables']['site_settings']['Row'];

type FieldConfig = { key: string; label: string; multiline?: boolean; hint?: string };

const SECTIONS: { title: string; description?: string; fields: FieldConfig[] }[] = [
  {
    title: '메인 화면 (Hero)',
    description: '홈페이지 맨 위 큰 배경 이미지 위에 표시되는 문구입니다.',
    fields: [
      { key: 'hero_title', label: '메인 제목 (굵고 큰 글씨, 줄바꿈으로 여러 줄 입력 가능)', multiline: true },
      { key: 'hero_subtitle', label: '메인 설명 문구 (제목 아래 작은 글씨)', multiline: true },
      { key: 'hero_cta_ticket_label', label: '입장권 버튼 문구' },
      { key: 'hero_cta_cabana_label', label: '케노피 버튼 문구' },
      { key: 'hero_cta_camping_label', label: '캠핑장 예약 버튼 문구' },
      { key: 'hero_cta_camping_url', label: '캠핑장 예약 버튼 연결 URL' },
    ],
  },
  {
    title: '상단 메뉴 (헤더 네비게이션)',
    fields: [
      { key: 'nav_pricing_label', label: '입장권 메뉴 문구' },
      { key: 'nav_cabana_label', label: '케노피 메뉴 문구' },
      { key: 'nav_facilities_label', label: '부속시설 메뉴 문구' },
      { key: 'nav_info_label', label: '이용안내 메뉴 문구' },
      { key: 'nav_gallery_label', label: '갤러리 메뉴 문구' },
    ],
  },
  {
    title: '모바일 하단 네비게이션',
    fields: [
      { key: 'mobile_nav_ticket_label', label: '입장권 버튼 문구' },
      { key: 'mobile_nav_cabana_label', label: '케노피 버튼 문구' },
    ],
  },
  {
    title: '중간 배너 (캠핑장 이용 고객 특별 혜택)',
    fields: [
      { key: 'benefit_title', label: '배너 제목' },
      { key: 'benefit_subtitle', label: '배너 부제목' },
      { key: 'benefit_note', label: '배너 안내 문구 (괄호 안내문)' },
    ],
  },
  {
    title: '입장권 섹션',
    description: '구매 버튼 문구는 "입장권 및 링크 관리" 메뉴에서 수정합니다.',
    fields: [
      { key: 'pricing_title', label: '섹션 제목' },
      { key: 'pricing_subtitle', label: '섹션 설명' },
      { key: 'pricing_pool_section_title', label: '일반 입장권 소제목' },
      { key: 'pricing_purchase_notice', label: '구매 안내 문구' },
      { key: 'pricing_season_notice', label: '시즌권 안내 문구 ("시즌권 안내:" 뒤에 표시)' },
      { key: 'pricing_entry_limit_notice', label: '입장 제한 안내 문구 ("입장 제한:" 뒤에 표시)' },
      { key: 'pricing_family_section_title', label: '가족 패키지 소제목' },
    ],
  },
  {
    title: '부속시설 섹션',
    description: '구매 버튼 문구는 "부속시설 관리" 메뉴에서 수정합니다.',
    fields: [
      { key: 'facilities_title', label: '섹션 제목' },
      { key: 'facilities_subtitle', label: '섹션 설명' },
    ],
  },
  {
    title: '케노피 섹션',
    description: '예약 버튼 문구·연결 URL은 "케노피 금액 수정" 메뉴에서 수정합니다.',
    fields: [
      { key: 'cabana_title', label: '섹션 제목' },
      { key: 'cabana_subtitle', label: '섹션 설명' },
      { key: 'cabana_diagram_title', label: '배치도 카드 제목' },
      { key: 'cabana_table_title', label: '금액 안내 카드 제목' },
      { key: 'cabana_notice_title', label: '안내사항 소제목' },
    ],
  },
  {
    title: '시설 배치도 섹션',
    fields: [
      { key: 'layout_title', label: '섹션 제목' },
      { key: 'layout_subtitle', label: '섹션 설명' },
      { key: 'layout_tab_total_label', label: '전체 배치도 탭 문구' },
      { key: 'layout_tab_cabana_label', label: '케노피 배치도 탭 문구' },
    ],
  },
  {
    title: '이용시간 안내 섹션',
    fields: [
      { key: 'info_title', label: '섹션 제목' },
      { key: 'info_subtitle', label: '섹션 설명' },
      { key: 'info_pool_card_title', label: '물놀이장 카드 제목' },
      { key: 'pool_season', label: '물놀이장 운영 시즌' },
      { key: 'pool_weekday_hours', label: '물놀이장 평일 운영시간' },
      { key: 'pool_weekend_hours', label: '물놀이장 주말 운영시간' },
      { key: 'pool_last_entry', label: '물놀이장 입장 마감 안내' },
      { key: 'info_facility_card_title', label: '부속시설 카드 제목' },
      { key: 'cabana_open_hours', label: '케노피 이용시간' },
      { key: 'cabana_usage_unit', label: '케노피 이용 단위 안내' },
      { key: 'cabana_notice', label: '케노피 안내사항 (줄바꿈으로 구분)', multiline: true },
      {
        key: 'info_parking_title',
        label: '주차 안내 카드 제목',
        hint: '이미지는 "그외 이미지 관리" 메뉴에서 업로드합니다. 이미지를 등록하지 않으면 이 카드는 표시되지 않습니다.',
      },
    ],
  },
  {
    title: '갤러리 섹션',
    fields: [
      { key: 'gallery_title', label: '섹션 제목' },
      { key: 'gallery_subtitle', label: '섹션 설명' },
    ],
  },
  {
    title: '안전수칙 섹션 (수영장 안전수칙)',
    fields: [
      { key: 'safety_title', label: '안전수칙 섹션 제목' },
      { key: 'safety_subtitle', label: '안전수칙 섹션 설명' },
      { key: 'safety_banner_title', label: '수칙 카드 상단 배너 제목' },
      {
        key: 'safety_rules_text',
        label: '안전수칙 10개 항목',
        multiline: true,
        hint: '한 줄에 하나씩, "제목|설명" 형식으로 입력하세요. 예) 절대 뛰지 않기|수영장 내에서는 걸어서 이동하세요',
      },
      { key: 'safety_extra_title', label: '추가 안내사항 제목' },
      {
        key: 'safety_extra_items',
        label: '추가 안내사항 3개 항목',
        multiline: true,
        hint: '한 줄에 하나씩, "제목|설명" 형식으로 입력하세요.',
      },
    ],
  },
  {
    title: '이용안내 및 주의사항 (FAQ 섹션)',
    description: '섹션 제목과 아코디언 5개 항목의 제목·내용을 수정합니다.',
    fields: [
      { key: 'faq_title', label: 'FAQ 섹션 제목' },
      { key: 'faq_subtitle', label: 'FAQ 섹션 설명' },
      { key: 'faq_item_1_title', label: '항목 1 제목' },
      { key: 'faq_item_1_lines', label: '항목 1 내용 (줄바꿈으로 구분)', multiline: true },
      { key: 'faq_item_2_title', label: '항목 2 제목' },
      { key: 'faq_item_2_lines', label: '항목 2 내용 (줄바꿈으로 구분)', multiline: true },
      { key: 'faq_item_3_title', label: '항목 3 제목' },
      { key: 'faq_item_3_lines', label: '항목 3 내용 (줄바꿈으로 구분)', multiline: true },
      { key: 'faq_item_4_title', label: '항목 4 제목' },
      { key: 'faq_item_4_lines', label: '항목 4 내용 (줄바꿈으로 구분)', multiline: true },
      { key: 'faq_item_5_title', label: '항목 5 제목' },
      { key: 'faq_item_5_lines', label: '항목 5 내용 (줄바꿈으로 구분)', multiline: true },
    ],
  },
  {
    title: '푸터',
    fields: [
      { key: 'footer_tagline', label: '로고 아래 소개 문구' },
      { key: 'footer_address_title', label: '"찾아오시는 길" 소제목' },
      { key: 'footer_address', label: '주소' },
      { key: 'footer_phone', label: '전화번호' },
      { key: 'footer_email', label: '이메일' },
      { key: 'footer_hours_title', label: '"운영 시간" 소제목' },
      { key: 'footer_terms_label', label: '이용약관 링크 문구' },
      { key: 'footer_privacy_label', label: '개인정보처리방침 링크 문구' },
      { key: 'footer_copyright', label: '저작권 문구' },
    ],
  },
];

function SettingRow({ value: initialValue, field }: { value: string; field: FieldConfig }) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await upsertSiteSetting(field.key, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="font-bold text-gray-900">{field.label}</label>
        {saved && <span className="text-sm text-green-600 font-semibold">저장됨</span>}
      </div>
      {field.hint && <p className="text-xs text-gray-500 mb-2">{field.hint}</p>}
      {field.multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
      <button
        onClick={handleSave}
        disabled={pending}
        className="mt-4 px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
      >
        {pending ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

export default function SettingsEditor({ settings }: { settings: SiteSetting[] }) {
  const valueMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-10">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-gray-500 mb-4">{section.description}</p>
          )}
          <div className="space-y-4">
            {section.fields.map((field) => (
              <SettingRow key={field.key} field={field} value={valueMap[field.key] ?? ''} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
