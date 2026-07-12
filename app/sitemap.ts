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
    { url: `${BASE}/collection`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    {
      url: `${BASE}/return-calculator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // روابط المحلات الديناميكية — تفشل بأمان إلى الصفحات الثابتة فقط
  try {
    const { data, error } = await supabase.from("shops").select("id");
    if (error || !data) return staticPages;

    const shopPages: MetadataRoute.Sitemap = data.map((s: { id: string }) => ({
      url: `${BASE}/shops/${s.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...shopPages];
  } catch {
    return staticPages;
  }
}
