import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// مفتاح anon العام فقط — ممنوع منعاً باتاً استعمال SUPABASE_SERVICE_ROLE_KEY هنا
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// إحصاءات صادقة محسوبة من أسعار المحلات الحقيقية لعيار 21 فقط.
export async function GET() {
  try {
    // شحن أسعار عيار 21 (الأقدم أولاً حتى يفوز الأحدث عند البناء)
    const { data: priceRows, error: priceErr } = await supabase
      .from("shop_prices")
      .select("shop_id, price, updated_at")
      .eq("karat", "21K")
      .order("updated_at", { ascending: true });

    if (priceErr) {
      return NextResponse.json({ error: priceErr.message }, { status: 500 });
    }

    // شحن المحافظات للمحلات
    const { data: shopRows, error: shopErr } = await supabase
      .from("shops")
      .select("id, province");

    if (shopErr) {
      return NextResponse.json({ error: shopErr.message }, { status: 500 });
    }

    const provinceOf = new Map<string, string>();
    for (const s of shopRows ?? []) {
      provinceOf.set(s.id as string, (s.province as string) ?? "");
    }

    // آخر سعر 21 لكل محل (الأحدث يفوز) + أحدث وقت تحديث إجمالي
    const latest21 = new Map<string, number>();
    let lastUpdated: string | null = null;

    for (const row of priceRows ?? []) {
      const price = Number(row.price);
      if (!Number.isFinite(price)) continue;
      latest21.set(row.shop_id as string, price);
      lastUpdated = row.updated_at as string;
    }

    // المتوسط = متوسط آخر سعر 21 عبر المحلات (دينار/غرام) — وحدة صحيحة
    const prices = [...latest21.values()];
    const averagePrice =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;

    // ترتيب المحافظات حسب عدد المحلات التي لها سعر 21
    const provinceCount = new Map<string, number>();
    for (const shopId of latest21.keys()) {
      const prov = provinceOf.get(shopId);
      if (!prov) continue;
      provinceCount.set(prov, (provinceCount.get(prov) ?? 0) + 1);
    }

    const provinceRanking = [...provinceCount.entries()]
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      topProvince: provinceRanking[0]?.province ?? "",
      topKarat: "21K",
      averagePrice,
      provinceRanking,
      lastUpdated,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
