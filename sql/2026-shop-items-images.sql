-- ============================================================
-- Goldary — صور متعددة لكل قطعة (shop_items.image_urls)
-- شغّليه مرة واحدة: Supabase Dashboard → SQL Editor → Run (آمن للإعادة)
-- نُبقي image_url كـ"غلاف" (أول صورة) للتوافق مع شاشات العرض الحالية.
-- ============================================================

alter table public.shop_items
  add column if not exists image_urls text[] not null default '{}';

-- تعبئة: الصورة المفردة الحالية → عنصر في المصفوفة
update public.shop_items
  set image_urls = array[image_url]
  where image_url is not null
    and (image_urls is null or image_urls = '{}');
