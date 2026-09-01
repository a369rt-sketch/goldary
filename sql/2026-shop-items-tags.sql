-- وسوم + وصف للقطع (shop_items) — لدعم البحث بالوسوم
-- شغّلي هذا في Supabase SQL Editor.

alter table public.shop_items
  add column if not exists description text,
  add column if not exists tags text[] not null default '{}';

-- فهرس GIN للبحث السريع داخل الوسوم (contains / overlap)
create index if not exists idx_shop_items_tags
  on public.shop_items using gin (tags);
