-- 이용안내 및 주의사항(FAQ) 아코디언 항목을 고정 5개(site_settings의
-- faq_item_1~5_title/lines)에서 관리자가 자유롭게 추가/삭제할 수 있는
-- 목록으로 전환하기 위한 테이블. gallery_images와 동일한 패턴(누구나 조회,
-- 관리자만 생성/수정/삭제)의 RLS를 적용합니다.
create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;

create policy "누구나 FAQ 항목 조회 가능" on public.faq_items
  for select using (true);

create policy "관리자만 FAQ 항목 생성 가능" on public.faq_items
  for insert with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 FAQ 항목 수정 가능" on public.faq_items
  for update using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "관리자만 FAQ 항목 삭제 가능" on public.faq_items
  for delete using (exists (select 1 from admin_users where user_id = auth.uid()));

-- 기존 site_settings에 저장돼 있던 고정 5개 항목을 새 테이블로 1회 이전
-- (faq_items가 비어있을 때만 실행 — 마이그레이션을 다시 실행해도 중복 삽입되지 않음)
insert into public.faq_items (title, content, sort_order)
select
  coalesce((select value from public.site_settings where key = 'faq_item_' || n || '_title'), ''),
  coalesce((select value from public.site_settings where key = 'faq_item_' || n || '_lines'), ''),
  n
from generate_series(1, 5) as n
where not exists (select 1 from public.faq_items)
  and exists (
    select 1 from public.site_settings
    where key = 'faq_item_' || n || '_title' and value <> ''
  );
