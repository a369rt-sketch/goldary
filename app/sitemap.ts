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
    {
      url: `${BASE}/return-calculator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const dynamic: MetadataRoute.Sitemap = [];

  // روابط المحلات — تفشل بأمان
  try {
    const { data } = await supabase.from("shops").select("id");
    for (const s of data ?? []) {
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
