-- ============================================================================
-- Goldary Phase 3 — مشتركو بوت تيليغرام (للبثّ اليومي للأسعار)
-- شغّليه في Supabase SQL Editor.
-- ============================================================================

create table if not exists public.telegram_subscribers (
  chat_id bigint primary key,
  created_at timestamptz not null default now()
);

-- RLS مفعّل بلا سياسات: الوصول حصراً عبر service role (البوت/الكرون).
alter table public.telegram_subscribers enable row level security;
