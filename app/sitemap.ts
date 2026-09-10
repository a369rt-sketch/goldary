import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://goldary.vercel.app";

// عميل anon فقط (نفس رؤية الجمهور عبر RLS — لا service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // الصفحات العامة الثابتة
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE}/shops`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/magazine`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/collection`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const dynamic: MetadataRoute.Sitemap = [];

  // روابط المحلات — تفشل بأمان. نجمع معرّفات ملّاك المحلات المعتمدة لفلترة المنتجات.
  const approvedOwners = new Set<string>();
  try {
    const { data } = await supabase
      .from("shops")
      .select("id, owner_id")
      .eq("status", "approved");
    for (const s of data ?? []) {
      if (s.owner_id) approvedOwners.add(s.owner_id as string);
      dynamic.push({
        url: `${BASE}/shops/${s.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* نتجاهل ونكمل */
  }

  // روابط المنتجات المنشورة من محلات معتمدة فقط — تفشل بأمان
  try {
    const { data } = await supabase
      .from("shop_items")
      .select("id, shop_id, updated_at")
      .eq("status", "published");
    for (const it of data ?? []) {
      if (!approvedOwners.has(it.shop_id as string)) continue;
      dynamic.push({
        url: `${BASE}/products/${it.id}`,
        lastModified: it.updated_at ? new Date(it.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    /* نتجاهل ونكمل */
  }

  // روابط المقالات المنشورة — RLS يقيّد للمنشور فقط، وتفشل بأمان
  try {
    const { data } = await supabase
      .from("articles")
      .select("slug, published_at")
      .eq("published", true);
    for (const a of data ?? []) {
      dynamic.push({
        url: `${BASE}/magazine/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* نتجاهل ونكمل */
  }

  return [...staticPages, ...dynamic];
}
