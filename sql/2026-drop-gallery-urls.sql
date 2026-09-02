-- حذف عمود معرض الصور من جدول shops (لم يعد مستخدماً بعد إزالة ميزة المعرض)
-- شغّلي هذا في Supabase SQL Editor.

alter table public.shops
  drop column if exists gallery_urls;
