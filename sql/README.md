# Goldary — قاعدة البيانات (توثيق)

قاعدة البيانات على **Supabase (PostgreSQL)**. هذا المجلد هو المصدر الموثّق لبنية القاعدة.

## الملفات

| الملف | الغرض |
|---|---|
| **`schema.sql`** | **المخطط المرجعي الكامل** لكل الجداول (16 جدول) — أعمدة/أنواع/مفاتيح/افتراضيات. مُستخرَج آلياً من القاعدة الحيّة. آمن ومتكرّر (`create table if not exists`). |
| `2026-profiles.sql` | جدول `profiles` (أنواع الحسابات: goldsmith / aurum) |
| `2026-shop-items.sql` | جدول `shop_items` (مخزون الصائغ) + RLS |
| `2026-shop-items-images.sql` | إضافة `image_urls text[]` للصور المتعددة |
| `2026-shop-items-tags.sql` | إضافة `tags text[]` + `description` + فهرس GIN للبحث |
| `2026-articles-workflow.sql` | سير عمل المجلة (حالات المقال + الموافقة) |
| `2026-aurum.sql` | جداول Aurum للادخار (`aurum_goals`, `aurum_transactions`) |
| `2026-aurum-target.sql` | `aurum_targets` (قطعة الهدف) |
| `2026-drop-gallery-urls.sql` | حذف عمود `shops.gallery_urls` (ميزة المعرض المُلغاة) |

> ملاحظة: ملفات `2026-*.sql` هي **مايجريشنات تاريخية** (تُشغَّل مرة في Supabase SQL Editor). أما `schema.sql` فهو **لقطة مرجعية** للبنية الحالية كاملة — للمراجعة والنسخ الاحتياطي، وليس مطلوباً تشغيله على قاعدة موجودة.

## كتالوج الجداول (حسب المجال)

**الهوية والأدوار**
- `profiles` — ملف المستخدم ونوع الحساب (`user_id → auth.users`)
- `admins` — مستخدمو الإدارة (`user_id → auth.users`)

**السوق (Marketplace)**
- `shops` — المحلات (المالك، المحافظة، الحالة pending/approved، العيارات المتوفرة)
- `shop_prices` — سعر كل عيار لكل محل (`shop_id → shops`)
- `shop_items` — منتجات/مخزون الصائغ (صور، وسوم، الحالة draft/published/sold)
- `products` — ⚠️ **جدول قديم يبدو غير مستخدم** (التطبيق يستخدم `shop_items`). يحمل `shop_item_id → shop_items`. يُنصح بالتحقق ثم الحذف لاحقاً.

**أسعار الذهب وذكاء السوق**
- `dollar_rate` — سعر صرف USD/IQD (append: آخر صف = الحالي)
- `gram_prices` — أسعار الغرام الميدانية (شراء/بيع/نمرة/أونصة)
- `numra_rate` — النمرة + فرق البيع
- `province_market_factors` — معاملات التسعير حسب المحافظة
- `price_observations` — رصد أسعار السوق (تحليلي)
- `user_calculations` — سجلّ حسابات الزوار (تحليلات)

**المجلة**
- `articles` — المقالات (حالة/موافقة/لقطة سعر/كاتب)

**Aurum (الادخار)**
- `aurum_goals` — أهداف الادخار
- `aurum_transactions` — الإيداعات (`goal_id → aurum_goals`)
- `aurum_targets` — قطعة الهدف المختارة (`item_id → shop_items`)

## ⚠️ ما لا يلتقطه `schema.sql` (حوكمة)

استُخرج المخطط عبر PostgREST/OpenAPI، لذلك **لا يتضمّن**:
- سياسات **RLS** (Row Level Security) وهي أساسية للأمان
- **الفهارس** (عدا ما توثّقه المايجريشنات، مثل فهرس GIN للوسوم)
- قيود **UNIQUE / CHECK** وسلوك **ON DELETE** للمفاتيح الأجنبية
- **المشغّلات (triggers)** والدوال

للحصول على لقطة مرجعية كاملة بنسبة 100% (تشمل ما سبق)، شغّلي محلياً مقابل connection string الخاص بـ Supabase:

```bash
pg_dump --schema-only --no-owner --no-privileges \
  "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  > sql/schema.full.sql
```

> Supabase تأخذ **نسخاً احتياطية تلقائية يومية** للقاعدة (Dashboard → Database → Backups). هذا الملف يوثّق البنية فقط، لا البيانات.

## كيف حُدّث `schema.sql`

مُولّد آلياً من مخطط OpenAPI للقاعدة الحيّة (جذر REST API مع مفتاح service role). لإعادة التوليد بعد أي تغيير على القاعدة، أعيدي جلب `/rest/v1/` بترويسة `Accept: application/openapi+json` وأعيدي توليد الملف.
