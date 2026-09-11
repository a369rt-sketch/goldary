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
--    ملاحظة: revoke على مستوى العمود لا يكفي — Supabase يمنح authenticated
--    صلاحية UPDATE على مستوى الجدول كله. لذلك نستخدم trigger يرفض تغيير
--    أعمدة الخطة إلا عبر service_role (مسار الأدمن) أو postgres (SQL editor).
create or replace function public.guard_shop_plan()
returns trigger language plpgsql as $$
declare
  jwt_role text := coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    current_user
  );
begin
  if (new.plan is distinct from old.plan
      or new.plan_expires_at is distinct from old.plan_expires_at)
     and jwt_role <> 'service_role'
     and current_user <> 'postgres' then
    raise exception 'تغيير خطة الاشتراك مسموح للإدارة فقط';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_shop_plan on public.shops;
create trigger trg_guard_shop_plan
  before update on public.shops
  for each row execute function public.guard_shop_plan();
