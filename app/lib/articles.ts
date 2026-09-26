import { supabase } from "@/app/lib/supabaseClient";

// أقسام المجلة (تطابق قيود CHECK في جدول articles)
export type ArticleCategory =
  | "news"
  | "analysis"
  | "learn"
  | "investment"
  | "markets";

// "يؤثر على" — محلي / عالمي / دولار
export type ArticleAffects = "local" | "global" | "dollar";

// حالة النسخة الإنجليزية (تطابق قيد CHECK في القاعدة)
export type TranslationStatus = "none" | "draft" | "approved";

// جدول articles — RLS يسمح للـanon بقراءة المنشور فقط (published = true)
export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: ArticleCategory;
  affects: ArticleAffects | null;
  price_snapshot_iqd: number | null;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  published_at: string | null;
  // النسخة الإنجليزية (المرحلة B) — قد تكون null على الصفوف القديمة
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  translation_status?: TranslationStatus | null;
};

// هل تُعرض النسخة الإنجليزية المعتمدة؟
export function hasApprovedEnglish(a: Article): boolean {
  return a.translation_status === "approved" && !!(a.content_en && a.title_en);
}

// اختيار الحقول حسب اللغة: الإنجليزية فقط إن كانت معتمدة، وإلا العربية
export function localizedArticle(
  a: Article,
  lang: "ar" | "en"
): { title: string; excerpt: string | null; content: string | null; isEnglish: boolean } {
  if (lang === "en" && hasApprovedEnglish(a)) {
    return {
      title: a.title_en as string,
      excerpt: a.excerpt_en ?? null,
      content: a.content_en ?? null,
      isEnglish: true,
    };
  }
  return { title: a.title, excerpt: a.excerpt, content: a.content, isEnglish: false };
}

// كل المقالات المنشورة — الأحدث أولاً
export async function getPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Articles fetch failed:", error);
    return [];
  }

  return (data ?? []) as Article[];
}

// مقال واحد بالـslug (RLS يقيّد للمنشور فقط)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Article fetch failed:", error);
    return null;
  }

  return (data as Article) ?? null;
}

// تسميات الأقسام بالعربي
export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  news: "أخبار",
  analysis: "تحليل السوق",
  learn: "تعلم الذهب",
  investment: "الاستثمار",
  markets: "أسواق ومحلات",
};

// بادج "يؤثر على" — رمز + نص
export const AFFECTS_META: Record<ArticleAffects, { icon: string; label: string }> = {
  local: { icon: "🟢", label: "محلي" },
  global: { icon: "🌍", label: "عالمي" },
  dollar: { icon: "💵", label: "دولار" },
};
