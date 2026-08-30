-- ============================================================
-- Goldary — مخزن الصائغ (shop_items)
-- شغّليه مرة واحدة: Supabase Dashboard → SQL Editor → Run (آمن للإعادة)
-- ملاحظة: shop_id = معرّف المستخدم الصائغ (auth.uid())، مطابق للـRLS المطلوب.
-- ============================================================

create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  image_url text,
  weight numeric,
  karat text,                     -- 24K / 22K / 21K / 18K
  price numeric,
  status text not null default 'draft' check (status in ('draft','published','sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_items_shop on public.shop_items (shop_id, created_at desc);
create index if not exists idx_shop_items_published on public.shop_items (status) where status = 'published';

alter table public.shop_items enable row level security;

-- الصائغ يدير قطعه فقط
drop policy if exists "shop_items_own" on public.shop_items;
create policy "shop_items_own" on public.shop_items
  for all
  using (shop_id = auth.uid())
  with check (shop_id = auth.uid());

-- الجميع يقرأ المنشور فقط (للعرض العام)
drop policy if exists "shop_items_public" on public.shop_items;
create policy "shop_items_public" on public.shop_items
  for select
  using (status = 'published');
