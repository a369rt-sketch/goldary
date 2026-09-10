-- ============================================================================
-- تشديد RLS على جدول shops: العموم يرون المحلات المعتمدة فقط
-- ============================================================================
-- المشكلة: المجهول (anon) كان يقرأ محلات pending/rejected — يضعف الثقة.
-- الحل: إعادة ضبط سياسات shops كاملةً:
--   • العموم (anon + authenticated): SELECT للمعتمدة فقط (status='approved')
--   • المالك: SELECT/INSERT/UPDATE لمحله هو (owner_id = auth.uid()) بأي حالة
--   • الأدمن: SELECT/UPDATE/DELETE للكل (نفس نمط 2026-profiles.sql)
--
-- ✅ يحافظ على: التسجيل (insert owner)، تعديل المالك للوحته، موافقة/رفض/حذف الأدمن.
-- شغّليه في Supabase SQL Editor. للتحقق لاحقاً:
--   select policyname, cmd, roles, qual from pg_policies where tablename='shops';
-- ============================================================================

alter table public.shops enable row level security;

-- 1) إزالة كل سياسات shops الحالية (بداية نظيفة — تشمل السياسة المتساهلة القديمة)
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'shops'
  loop
    execute format('drop policy if exists %I on public.shops', pol.policyname);
  end loop;
end $$;

-- 2) SELECT
-- العموم: المعتمدة فقط
create policy shops_select_public on public.shops
  for select to anon, authenticated
  using (status = 'approved');

-- المالك: محله هو بأي حالة (للوحة التحكم)
create policy shops_select_owner on public.shops
  for select to authenticated
  using (owner_id = auth.uid());

-- الأدمن: الكل
create policy shops_select_admin on public.shops
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 3) INSERT — المالك ينشئ محله فقط (التسجيل)
create policy shops_insert_owner on public.shops
  for insert to authenticated
  with check (owner_id = auth.uid());

-- 4) UPDATE
-- المالك يحدّث محله
create policy shops_update_owner on public.shops
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- الأدمن يحدّث أي محل (موافقة/رفض/إظهار)
create policy shops_update_admin on public.shops
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 5) DELETE — الأدمن فقط
create policy shops_delete_admin on public.shops
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
