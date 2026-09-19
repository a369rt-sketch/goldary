-- ============================================================================
-- Goldary — أسرار التطبيق (مثل توكن بوت تيليغرام) عند تعذّر ضبطها في بيئة Vercel
-- محميّة بـ RLS بلا سياسات: الوصول حصراً عبر service role (الدوال الخادمية).
-- شغّليه في Supabase SQL Editor.
-- ============================================================================

create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
