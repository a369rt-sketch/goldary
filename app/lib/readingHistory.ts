// سجل قراءة الزائر (بلا حساب) — يُحفظ في localStorage داخل try/catch.
// يُستخدم لتخصيص قسم "مختارة لك" في الصفحة الرئيسية:
//  • categories: التصنيفات التي قرأها الزائر (الأحدث أولاً، مع تكرار يعكس الاهتمام)
//  • slugs: المقالات التي فتحها (لاستبعادها من المقترحات)
import type { ArticleCategory } from "./articles";

const CAT_KEY = "mag_read_categories";
const SLUG_KEY = "mag_read_slugs";
const MAX = 40; // سقف لتفادي نموّ التخزين بلا حدود

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* تخزين ممتلئ أو محظور — نتجاهل بهدوء */
  }
}

// يُسجَّل عند فتح مقال: يضيف التصنيف (مع التكرار) وslug (بلا تكرار) في المقدّمة.
export function recordRead(category: ArticleCategory, slug: string) {
  writeList(CAT_KEY, [category, ...readList(CAT_KEY)]);
  writeList(SLUG_KEY, [slug, ...readList(SLUG_KEY).filter((s) => s !== slug)]);
}

// التصنيفات مرتّبة حسب الأكثر قراءة (تنازلياً).
export function topCategories(): ArticleCategory[] {
  const counts = new Map<string, number>();
  for (const c of readList(CAT_KEY)) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c as ArticleCategory);
}

// slugs التي قرأها الزائر (لاستبعادها).
export function readSlugs(): Set<string> {
  return new Set(readList(SLUG_KEY));
}
