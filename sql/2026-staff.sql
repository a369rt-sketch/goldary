-- ============================================================================
-- Goldary Phase 2 — سجلّ الموظفين + إسناد الفواتير
-- شغّليه في Supabase SQL Editor.
-- ============================================================================

-- 1) سجلّ موظفي المحل
create table if not exists public.shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,            -- = auth.uid() لصاحب المحل
  name text not null,
  role text,                        -- مثل: بائع، مدير، صائغ، محاسب
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists shop_staff_shop_idx on public.shop_staff(shop_id);

alter table public.shop_staff enable row level security;

drop policy if exists shop_staff_owner_all on public.shop_staff;
create policy shop_staff_owner_all on public.shop_staff
  for all to authenticated
  using (shop_id = auth.uid())
  with check (shop_id = auth.uid());

drop policy if exists shop_staff_admin_read on public.shop_staff;
create policy shop_staff_admin_read on public.shop_staff
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 2) إسناد الفاتورة لموظف (من نفّذها) — الحذف يترك null دون فقد الفاتورة
alter table public.invoices
  add column if not exists staff_id uuid references public.shop_staff(id) on delete set null;
