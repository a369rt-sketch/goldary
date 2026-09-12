-- ============================================================================
-- Goldary — دخول الموظفين + الصلاحيات (Phase 2 متابعة)
-- الفكرة: الموظف يسجّل دخوله ببريده (OTP)، ويُطابَق بـ shop_staff عبر البريد
-- المُوثّق في الـJWT — دون ربط حسابات يدوي. شغّليه في Supabase SQL Editor.
-- ============================================================================

-- 1) أعمدة الدخول/الصلاحيات على الموظف
alter table public.shop_staff add column if not exists email text;
alter table public.shop_staff add column if not exists permissions text[] not null default '{}';
create index if not exists shop_staff_email_idx on public.shop_staff (lower(email));

-- 2) المحلات (= owner uid) التي ينتمي لها المستخدم الحالي كموظف فعّال،
--    عبر مطابقة البريد المُوثّق. SECURITY DEFINER ليتجاوز RLS على shop_staff (يمنع التكرار).
create or replace function public.staff_shop_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select shop_id
  from public.shop_staff
  where active = true
    and email is not null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- 3) سياسات وصول الموظفين (إضافة — لا تمسّ سياسات المالك الموجودة، فالسياسات تُجمع بـ OR)

-- المخزون
drop policy if exists shop_items_staff on public.shop_items;
create policy shop_items_staff on public.shop_items
  for all to authenticated
  using (shop_id in (select public.staff_shop_ids()))
  with check (shop_id in (select public.staff_shop_ids()));

-- الفواتير
drop policy if exists invoices_staff on public.invoices;
create policy invoices_staff on public.invoices
  for all to authenticated
  using (shop_id in (select public.staff_shop_ids()))
  with check (shop_id in (select public.staff_shop_ids()));

-- بنود الفواتير (عبر الفاتورة الأم)
drop policy if exists invoice_items_staff on public.invoice_items;
create policy invoice_items_staff on public.invoice_items
  for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.shop_id in (select public.staff_shop_ids())))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.shop_id in (select public.staff_shop_ids())));

-- قراءة زملاء العمل (للإسناد في الفواتير). الإدارة (إضافة/حذف) تبقى للمالك فقط.
drop policy if exists shop_staff_staff_read on public.shop_staff;
create policy shop_staff_staff_read on public.shop_staff
  for select to authenticated
  using (shop_id in (select public.staff_shop_ids()));

-- ملاحظة حوكمة: الوصول هنا على مستوى المحل لأي موظف فعّال؛ مصفوفة permissions
-- تُقيّد أقسام الواجهة. تقييد RLS لكل صلاحية على حدة تحسين لاحق.
