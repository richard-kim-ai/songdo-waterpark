# 송도국제캠핑장 물놀이장 웹사이트

Next.js(App Router) + Supabase + Vercel 스택으로 구성된 물놀이장 랜딩 페이지 / 예약 시스템입니다.

## 스택

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — 요금표(입장권/카바나) 데이터베이스, 추후 예약 저장
- **Vercel** — 배포

## 폴더 구조

```
songdo-waterpark/
├── app/                  # 페이지 (App Router)
│   ├── layout.tsx
│   ├── page.tsx          # 메인 랜딩 페이지
│   └── globals.css
├── components/           # 섹션별 컴포넌트
├── lib/supabase/         # Supabase 클라이언트 (client / server / admin)
├── types/database.ts     # DB 타입 정의
└── supabase/migrations/  # SQL 마이그레이션
```

---

## 1. 로컬 개발 셋업

```bash
cd songdo-waterpark
npm install
cp .env.example .env.local   # 값 채우기 (2번 항목 참고)
npm run dev
```

`http://localhost:3000` 에서 확인합니다. Supabase 환경변수가 없어도 페이지는 빈 데이터로 렌더링되므로 우선 UI만 확인할 수도 있습니다.

---

## 2. Supabase 설정

1. https://supabase.com 에서 새 프로젝트를 생성합니다 (리전은 `Northeast Asia (Seoul)` 권장).
2. **Project Settings → API** 에서 아래 값을 복사해 `.env.local`에 채웁니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 서버 전용, 절대 커밋/클라이언트 노출 금지)
3. **SQL Editor**를 열고 `supabase/migrations/0001_init.sql` 내용을 그대로 붙여넣어 실행합니다.
   - 테이블 4개(`ticket_types`, `cabana_zones`, `ticket_orders`, `cabana_reservations`) 생성
   - RLS(Row Level Security) 활성화 + 요금표 조회 정책 추가
   - 참조 사이트 기준 초기 요금 데이터 삽입
4. (선택) Supabase CLI를 쓴다면:
   ```bash
   npx supabase login
   npx supabase link --project-ref <프로젝트REF>
   npx supabase db push
   ```

### 쓰기(예약/주문) 처리 방식

`ticket_orders`, `cabana_reservations` 테이블은 RLS만 켜두고 별도 정책을 추가하지 않았습니다. 즉 브라우저(anon key)에서는 읽기/쓰기가 모두 차단되고, 예약을 저장하려면 **Server Action** 또는 **Route Handler**에서 `lib/supabase/admin.ts`의 `createAdminClient()`를 사용해야 합니다. 예약 폼을 붙일 때 이 구조를 그대로 따르면 됩니다.

---

## 3. Git 저장소 생성 및 GitHub 업로드

```bash
git init
git add .
git commit -m "chore: 초기 프로젝트 셋업 (Next.js + Supabase)"

# GitHub에서 새 저장소를 만든 뒤 (Add README 체크 해제)
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git branch -M main
git push -u origin main
```

> 이미 로컬에서 `git init` 및 첫 커밋까지는 완료되어 있습니다. 위 `remote add`부터 진행하시면 됩니다.

---

## 4. Vercel 배포

1. https://vercel.com → **Add New → Project** → GitHub 저장소 선택 (Import)
2. Framework Preset은 Next.js로 자동 감지됩니다. 빌드 설정은 기본값 그대로 두면 됩니다.
3. **Environment Variables**에 아래 3개를 등록합니다 (Production / Preview 모두):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy** 클릭 → 완료 후 `https://<프로젝트명>.vercel.app` 에서 확인합니다.
5. 이후 `main` 브랜치에 push할 때마다 자동으로 재배포됩니다.

### 커스텀 도메인 연결 (선택)

Vercel 프로젝트 → **Settings → Domains** 에서 보유 도메인을 추가하고, 안내되는 CNAME/A 레코드를 도메인 관리 페이지(가비아, 후이즈 등)에 등록합니다.

---

## 다음 단계 제안

- [ ] 카바나/입장권 예약 폼 → Server Action으로 `ticket_orders` / `cabana_reservations`에 저장
- [ ] 관리자용 예약 현황 페이지 (일자별 잔여 유닛 계산)
- [ ] 갤러리 이미지를 Supabase Storage에 업로드하고 `next/image`로 교체
- [ ] 실제 카바나 배치도 이미지·전체 배치도 이미지 삽입
- [ ] 결제 연동(토스페이먼츠/아이엠포트 등) — 시즌권·카바나 결제
