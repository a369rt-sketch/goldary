-- ============================================================================
-- Goldary Phase 2 — نظام الاشتراك (Freemium)
-- free = حضور في السوق · pro = الأدوات التشغيلية (فواتير/تقارير/مخزون)
-- شغّليه في Supabase SQL Editor.
-- ============================================================================

-- 1) أعمدة الخطة على المحل
alter table public.shops add column if not exists plan text not null default 'free';
alter table public.shops add column if not exists plan_expires_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'shops_plan_check') then
    alter table public.shops add constraint shops_plan_check check (plan in ('free','pro'));
  end if;
end $$;

-- 2) أمان: يُمنع المالك/العموم من تعديل خطة الاشتراك (لتفادي الترقية الذاتية).
--    التفعيل يتم حصراً عبر مسار الأدمن (service role يتجاوز صلاحيات الأعمدة).
revoke update (plan, plan_expires_at) on public.shops from anon, authenticated;
