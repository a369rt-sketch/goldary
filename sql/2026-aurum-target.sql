-- ============================================================
-- Aurum — قطعة الهدف التي تختارها المدخرة (aurum_targets)
-- شغّليه مرة واحدة: Supabase Dashboard → SQL Editor → Run (آمن للإعادة)
-- هدف واحد لكل مستخدم (user_id مفتاح رئيسي).
-- ============================================================

create table if not exists public.aurum_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.aurum_targets enable row level security;

drop policy if exists "aurum_targets_own" on public.aurum_targets;
create policy "aurum_targets_own" on public.aurum_targets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
