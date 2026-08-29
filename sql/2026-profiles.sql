-- ============================================================
-- Goldary — نظام الحسابات الموحّد (profiles)
-- شغّليه مرة واحدة: Supabase Dashboard → SQL Editor → Run (آمن للإعادة)
-- ============================================================

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('goldsmith','aurum')),
  name text,
  email text,
  phone text,
  shop_name text,   -- للصاغة
  location text,    -- للصاغة
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- كل مستخدم يدير ملفه فقط
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- الأدمن يقرأ كل الملفات (للتحليل)
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
  for select
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
