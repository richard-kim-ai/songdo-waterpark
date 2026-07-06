# 관리자 페이지 구현 계획

## Context

현재 홈페이지는 입장권 가격, 카바나 요금, 이용시간, 포토갤러리 등 핵심 콘텐츠 상당수가
`components/*.tsx`에 하드코딩되어 있거나(`InfoNotice`, `Gallery`), Supabase `ticket_types` /
`cabana_zones` 테이블에서 읽어오되(`Pricing`, `Facilities`, `Cabana`) 수정 수단이 없다(관리자 UI,
인증 없음). 운영자가 매 시즌/이벤트마다 개발자에게 코드 수정을 요청하지 않고 직접 가격·문구·팝업·
갤러리를 바꿀 수 있도록 `/admin` 경로에 인증된 관리자 대시보드를 추가한다. 인증은 Supabase Auth
(이메일/비밀번호)로 구현하기로 사용자와 확정했다.

## DB 스키마 변경 (`supabase/migrations/0002_admin.sql`)

- `admin_users (user_id uuid primary key references auth.users)` — 관리자 화이트리스트. select 정책만
  `user_id = auth.uid()`로 허용, insert/update는 정책 없음(SQL Editor에서 service_role로만 등록).
- `ticket_types`에 컬럼 추가: `purchase_url text`, `usage_hours text` (부속시설 이용시간 텍스트,
  attraction 카테고리에서만 사용).
- `cabana_zones`는 컬럼 추가 없음(기존 가격/개수 컬럼 그대로 사용).
- `site_settings (key text primary key, value text not null default '', updated_at timestamptz)` —
  이용시간 안내 문구 저장소. 초기 시드 키: `pool_season`, `pool_weekday_hours`, `pool_weekend_hours`,
  `pool_last_entry`, `cabana_open_hours`, `cabana_usage_unit`, `cabana_notice`(카바나 안내사항 불릿,
  줄바꿈 구분) — 값은 현재 하드코딩된 텍스트 그대로 시드.
- `popups (id uuid pk, title text, image_path text, link_url text, is_active boolean default true,
  start_date date, end_date date, sort_order int default 0, created_at timestamptz)`.
- `gallery_images (id uuid pk, label text, image_path text not null, sort_order int default 0,
  created_at timestamptz)` — 시드로 기존 gallery-1~6 항목 삽입(현재 `Gallery.tsx`의 `ITEMS` 그대로).
- RLS: 기존 `ticket_types`/`cabana_zones` select-all 정책 유지 + admin_users 존재 체크하는 update
  정책 추가. `site_settings`/`gallery_images`는 select-all(공개) + admin update/insert. `popups`는
  `is_active = true`(공개, 날짜 범위 체크는 앱단에서) + admin 전체 CRUD.
- Storage: `site-images` 버킷(이미 존재, public)에 대해 `storage.objects` insert/update/delete
  정책을 admin_users 체크로 추가 (select는 버킷이 public이라 이미 열려 있음).
- `types/database.ts`에 위 테이블/컬럼 타입 추가.

## 인증 & 라우트 보호

- `lib/supabase/middleware.ts` — `@supabase/ssr` 공식 패턴의 `updateSession(request)` (세션 쿠키 갱신).
- `middleware.ts` (루트) — matcher `['/admin/:path*']`로 위 함수 호출.
- `lib/admin/auth.ts` — `requireAdmin()`: 서버 클라이언트로 `getUser()` 후 `admin_users`에서 본인
  행 조회, 없으면 `redirect('/admin/login')`. 각 admin 서버 액션과 레이아웃에서 재사용.
- `app/admin/login/page.tsx` — 클라이언트 컴포넌트, `lib/supabase/client.ts`의 `createClient()`로
  `signInWithPassword`, 성공 시 `/admin`으로 이동, 실패 시 에러 메시지.
- `app/admin/(dashboard)/layout.tsx` — `requireAdmin()` 가드 + 사이드바(사용자가 준 목업 구조 재사용:
  팝업/입장권/부속시설/카바나/이용시간/갤러리) + 로그아웃 버튼.
- 관리자 계정 생성은 코드로 만들지 않음(비밀번호를 다룰 이유가 없음) — 마이그레이션 적용 후 Supabase
  Dashboard의 Authentication > Add User로 계정 생성하고, 발급된 UID로
  `insert into admin_users (user_id) values ('<UID>');`를 SQL Editor에서 1회 실행하도록 안내.
  (마이그레이션 파일 하단에 주석으로 정확한 안내문 포함)

## 관리자 페이지 구성 (`app/admin/(dashboard)/...`)

사용자가 제공한 목업의 6개 탭 구조를 그대로 따른다:

1. **`popups/page.tsx`** — `popups` 리스트(활성/기간/순서), 생성/수정 폼(이미지 업로드, 링크URL,
   활성여부, 시작/종료일), 삭제.
2. **`tickets/page.tsx`** — `ticket_types` category IN ('general','family_package') 행들의 가격 +
   `purchase_url` 인라인 수정.
3. **`facilities/page.tsx`** — `ticket_types` category = 'attraction' (신나는기차/마이카/빅2패키지)
   행들의 가격 + `purchase_url` + `usage_hours`(이용시간 텍스트) 수정 — 패키지 구매가격도 동일
   테이블의 한 행이라 별도 로직 불필요.
4. **`cabana/page.tsx`** — `cabana_zones` 행들의 `weekday_price`/`weekend_price`/`unit_count` 수정.
5. **`hours/page.tsx`** — `site_settings`의 이용시간 관련 키(위 시드 키 목록) 텍스트 수정 폼.
6. **`gallery/page.tsx`** — `gallery_images` 목록(썸네일/라벨/순서), 파일 업로드로 신규 추가, 라벨/
   순서 수정, 삭제.

공통: `app/admin/actions.ts`에 `'use server'` 함수들(`upsertTicket`, `upsertCabanaZone`,
`upsertSiteSetting`, `createPopup`/`updatePopup`/`deletePopup`, `createGalleryImage`/
`updateGalleryImage`/`deleteGalleryImage`, `uploadSiteImage`, `signOutAdmin`). 각 액션 시작 시
`requireAdmin()` 재검증(방어적, RLS도 이중 보호) 후 `revalidatePath('/')` + 해당 admin 페이지 경로
호출.

## 공개 페이지 변경

- `app/page.tsx`: `site_settings`, `popups`(활성+기간 필터), `gallery_images` fetch 추가해서
  `InfoNotice`/`Cabana`/`Gallery`/신규 `PopupModal`에 전달.
- `components/InfoNotice.tsx`: props로 `settings`(site_settings 맵) + `tickets`(attraction만, 이용시간
  표시용) 받아 하드코딩 텍스트 제거.
- `components/Cabana.tsx`: `settings.cabana_notice`를 안내사항 불릿으로 렌더링(줄바꿈 split).
- `components/Gallery.tsx`: 하드코딩 `ITEMS` 제거, `images: GalleryImage[]` prop 사용,
  `lib/images.ts`에 추가할 `publicUrl(path)` 헬퍼로 URL 생성.
- `components/Pricing.tsx` / `components/Facilities.tsx`: 버튼을 `t.purchase_url`이 있으면
  `<a href=... target="_blank">`로, 없으면 기존 정적 버튼 유지.
- 신규 `components/PopupModal.tsx` (client): 활성 팝업을 순차 모달로 표시, 이미지 클릭 시
  `link_url` 이동(새 탭), 닫기(X), "오늘 하루 보지 않기" 체크 시 자정 만료 쿠키 저장.
- `components/Footer.tsx`: 저작권/약관 줄 옆에 작은 회색 텍스트 링크 "관리자 로그인" → `href="/admin"`
  추가(비로그인 시 레이아웃 가드가 `/admin/login`으로 리다이렉트).

## 검증

1. `npm run typecheck` — 새 타입/스키마 반영 확인.
2. `npm run dev` 실행 후 Supabase 마이그레이션(0002) 적용 상태에서:
   - `/admin` 접속 → 미로그인 시 `/admin/login`으로 리다이렉트 확인.
   - 관리자 계정으로 로그인 → 대시보드 진입, 로그아웃 동작 확인.
   - 6개 탭 각각에서 값 수정 → 저장 → 홈페이지(`/`)에서 즉시 반영 확인(가격, 이용시간 문구, 카바나
     안내, 갤러리 이미지/업로드, 팝업 노출/닫기/오늘그만보기).
   - 푸터의 "관리자 로그인" 링크 클릭 → 로그인 화면 진입 확인.
3. 비로그인 상태에서 admin 서버 액션 직접 호출 시도 시 RLS/`requireAdmin()`에 의해 차단되는지 확인
   (다른 브라우저 시크릿 모드 또는 로그아웃 후 재확인).
