-- ============================================================
-- Aurum by Goldary — ادّخار الذهب بذكاء
-- شغّليه مرة واحدة: Supabase Dashboard → SQL Editor → Run (آمن للإعادة)
-- ============================================================

-- 1) جدول الأهداف
create table if not exists public.aurum_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_name text not null,
  goal_type text,                      -- marriage | house | travel | emergency | study
  target_amount numeric not null,
  monthly_saving numeric,
  duration_months int,
  current_amount numeric not null default 0,
  status text not null default 'active', -- active | completed | paused
  created_at timestamptz not null default now()
);

-- 2) جدول الإيداعات
create table if not exists public.aurum_transactions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.aurum_goals(id) on delete cascade,
  amount numeric not null,
  date timestamptz not null default now(),
  notes text
);

create index if not exists idx_aurum_goals_user on public.aurum_goals (user_id, created_at desc);
create index if not exists idx_aurum_tx_goal on public.aurum_transactions (goal_id, date desc);

-- 3) RLS: كل مستخدم يدير أهدافه وإيداعاته فقط
alter table public.aurum_goals enable row level security;
alter table public.aurum_transactions enable row level security;

drop policy if exists "aurum_goals_own" on public.aurum_goals;
create policy "aurum_goals_own" on public.aurum_goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "aurum_tx_own" on public.aurum_transactions;
create policy "aurum_tx_own" on public.aurum_transactions
  for all
  using (exists (
    select 1 from public.aurum_goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.aurum_goals g
    where g.id = goal_id and g.user_id = auth.uid()
  ));
