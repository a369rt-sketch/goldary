-- ============================================================
-- Goldary — النسخة الإنجليزية لمقالات المجلة (المرحلة B)
-- شغّلي هذا مرة واحدة في: Supabase Dashboard → SQL Editor → Run
-- آمن للإعادة (idempotent). لا يمسّ الصفوف الحالية ولا سياسات RLS.
-- ============================================================

-- 1) أعمدة النسخة الإنجليزية + حالة الترجمة على جدول المقالات
alter table public.articles
  add column if not exists title_en   text,
  add column if not exists excerpt_en text,
  add column if not exists content_en text,
  add column if not exists translation_status text not null default 'none';

-- 2) قيد حالات الترجمة المسموحة (يُضاف مرة واحدة)
--    none     = لا توجد نسخة إنجليزية (يُعرض المقال بالعربية + ملاحظة)
--    draft    = ترجمة تلقائية بانتظار مراجعة الأدمن (لا تُعرض للجمهور)
--    approved = نسخة إنجليزية معتمدة (تُعرض عند اختيار اللغة الإنجليزية)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'articles_translation_status_check'
  ) then
    alter table public.articles
      add constraint articles_translation_status_check
      check (translation_status in ('none','draft','approved'));
  end if;
end $$;

-- 3) الصفوف الحالية تبقى 'none' افتراضياً — لا حاجة لأي backfill.

-- ============================================================
-- ملاحظات RLS (لا تغيير مطلوب):
--  • الأعمدة الجديدة على نفس صفوف articles، فسياسة anon الحالية
--    (قراءة الصفوف المنشورة published=true فقط) تشملها تلقائياً عبر select *.
--  • النسخة الإنجليزية لا تُعرض للجمهور إلا حين translation_status='approved'
--    — هذا يُفرض في طبقة التطبيق (العرض)، لا في RLS، تماماً كعمود published/status.
--  • الكتابة في *_en تمرّ عبر مسار API بصلاحية الخدمة (كما بقية تعديلات المقالات).
-- ============================================================
