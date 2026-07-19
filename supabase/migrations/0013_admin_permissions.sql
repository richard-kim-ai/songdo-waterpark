-- 관리자 세분화 권한: 슈퍼 관리자(전체 권한) vs 제한된 관리자(선택한 메뉴만 접근)
alter table public.admin_users add column if not exists is_super_admin boolean not null default false;
alter table public.admin_users add column if not exists permissions text[] not null default '{}';

-- 기존에 등록되어 있던 관리자는 지금까지와 동일하게 전체 권한을 유지하도록 슈퍼 관리자로 승격
update public.admin_users set is_super_admin = true;
