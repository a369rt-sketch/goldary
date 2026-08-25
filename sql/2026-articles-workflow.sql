-- ============================================================
-- Goldary — نظام إدارة مقالات المجلة (أدوار + موافقة)
-- شغّلي هذا مرة واحدة في: Supabase Dashboard → SQL Editor → Run
-- آمن للإعادة (idempotent).
-- ============================================================

-- 1) أعمدة جديدة على جدول المقالات
alter table public.articles
  add column if not exists status text not null default 'draft',
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists author_name text;

-- قيد الحالات المسموحة (يُضاف مرة واحدة)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'articles_status_check'
  ) then
    alter table public.articles
      add constraint articles_status_check
      check (status in ('draft','pending','approved','rejected'));
  end if;
end $$;

-- 2) تعبئة الحالة من عمود published الحالي (المنشور → approved، الباقي → draft)
update public.articles
  set status = case when published then 'approved' else 'draft' end
  where status is null or status = 'draft';

-- 3) فهرس لتسريع قوائم الأدمن (Pending أولاً)
create index if not exists idx_articles_status_created
  on public.articles (status, created_at desc);

-- ملاحظة: نُبقي عمود published مزامناً من التطبيق (published = status='approved')
-- حتى لا نغيّر سياسات RLS العامة (anon يقرأ published=true فقط).
