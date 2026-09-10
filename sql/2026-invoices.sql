-- ============================================================================
-- Goldary Phase 2 — الفواتير (بيع/شراء/تصليح) + بنودها
-- شغّليه في Supabase SQL Editor.
-- ============================================================================

-- 1) رأس الفاتورة
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,                         -- = auth.uid() لصاحب المحل (نفس نمط shop_items.shop_id)
  number integer not null,                       -- تسلسلي لكل محل (يضبطه trigger)
  type text not null default 'sale' check (type in ('sale','purchase','repair')),
  customer_name text,
  customer_phone text,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  status text not null default 'issued' check (status in ('issued','void')),
  created_at timestamptz not null default now()
);
create unique index if not exists invoices_shop_number_uidx on public.invoices(shop_id, number);
create index if not exists invoices_shop_idx on public.invoices(shop_id, created_at desc);

-- 2) بنود الفاتورة (تفاصيل الذهب)
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  shop_item_id uuid references public.shop_items(id) on delete set null,  -- ربط اختياري بالمخزون
  description text not null default '',
  weight numeric,
  karat text,
  price_per_gram numeric,
  making_fee numeric not null default 0,
  quantity integer not null default 1,
  line_total numeric not null default 0
);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);

-- 3) ترقيم تسلسلي لكل محل (number = آخر رقم للمحل + 1)
create or replace function public.set_invoice_number()
returns trigger language plpgsql as $$
begin
  if new.number is null or new.number = 0 then
    select coalesce(max(number), 0) + 1
      into new.number
      from public.invoices
      where shop_id = new.shop_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_invoice_number on public.invoices;
create trigger trg_invoice_number
  before insert on public.invoices
  for each row execute function public.set_invoice_number();

-- 4) RLS — المالك يدير فواتيره فقط، والأدمن يقرأ
alter table public.invoices enable row level security;

drop policy if exists invoices_owner_all on public.invoices;
create policy invoices_owner_all on public.invoices
  for all to authenticated
  using (shop_id = auth.uid())
  with check (shop_id = auth.uid());

drop policy if exists invoices_admin_read on public.invoices;
create policy invoices_admin_read on public.invoices
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

alter table public.invoice_items enable row level security;

drop policy if exists invoice_items_owner_all on public.invoice_items;
create policy invoice_items_owner_all on public.invoice_items
  for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.shop_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.shop_id = auth.uid()));

drop policy if exists invoice_items_admin_read on public.invoice_items;
create policy invoice_items_admin_read on public.invoice_items
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
