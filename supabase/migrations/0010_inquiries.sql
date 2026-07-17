-- ============================================================
-- 송도국제캠핑장 물놀이장 — 고객 비밀 게시판(inquiries)
-- 가입 없이 누구나 작성. 공개 목록에는 게시자 아이디·작성일·답변여부만 노출되고
-- 제목/내용/답변은 비공개. 작성자는 본인이 정한 아이디+비밀번호로만 열람 가능,
-- 관리자는 전체를 확인/답변합니다.
--
-- 보안: RLS를 켜되 anon/authenticated 정책을 두지 않아 직접 접근을 전면 차단합니다.
-- 모든 읽기/쓰기는 서버(서비스롤)에서 서버 액션을 통해서만 이뤄지며, 목록 조회 시
-- 안전한 컬럼(아이디/작성일/답변여부)만 반환해 제목·내용 노출을 원천 차단합니다.
-- 비밀번호는 평문 저장하지 않고 salt:scrypt 해시로 저장합니다.
-- ============================================================

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  author_id text not null,
  password_hash text not null,
  title text not null,
  content text not null,
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on inquiries (created_at desc);

alter table inquiries enable row level security;
-- 정책 없음 = anon/authenticated 직접 접근 차단. 서비스롤만 접근(서버 액션 경유).
