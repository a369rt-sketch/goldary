import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// service role على الخادم فقط. الرد يحتوي **فقط** تجميعات عامة آمنة للزائر:
// أسعار الغرام، اتجاه السوق، سلسلة السعر، ترتيب المحافظات (نِسَب نسبية بلا أعداد خام)،
// العيار الأكثر طلباً، آخر تحديث + Live. ممنوع منعاً باتاً إرجاع أي مقياس إداري
// (Total Calculations / Modified Users / Customization Rate) أو أي صفوف خام.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAY = 24 * 60 * 60 * 1000;
const MAX_POINTS = 40;

export async function GET() {
  try {
    const now = Date.now();

    // ---- gram_prices: السعر الحي 21K + آخر تحديث + Live ----
    const { data: lastGram } = await supabase
      .from("gram_prices")
      .select("buy_gram_iqd, sell_gram_iqd, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const buyGram = lastGram?.buy_gram_iqd != null ? Number(lastGram.buy_gram_iqd) : null;
    const sellGram = lastGram?.sell_gram_iqd != null ? Number(lastGram.sell_gram_iqd) : null;
    const lastUpdate = lastGram?.recorded_at ?? null;
    const minutesSince = lastUpdate
      ? (now - new Date(lastUpdate).getTime()) / 60000
      : null;
    const isLive = minutesSince != null && minutesSince <= 30;

    // ---- gram_prices: سلسلة آخر 30 يوم + اتجاه السوق ----
    const since = new Date(now - 30 * DAY).toISOString();
    const { data: priceRows } = await supabase
      .from("gram_prices")
      .select("recorded_at, sell_gram_iqd")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    const rawSeries = (priceRows ?? [])
      .map((r: any) => Number(r.sell_gram_iqd))
      .filter((n: number) => Number.isFinite(n));

    let priceSeries = rawSeries;
    if (rawSeries.length > MAX_POINTS) {
      const step = (rawSeries.length - 1) / (MAX_POINTS - 1);
      priceSeries = Array.from({ length: MAX_POINTS }, (_, i) =>
        rawSeries[Math.round(i * step)]
      );
    }

    const marketMovement =
      rawSeries.length >= 2 && rawSeries[0] > 0
        ? Math.round(
            ((rawSeries[rawSeries.length - 1] - rawSeries[0]) / rawSeries[0]) *
              1000
          ) / 10
        : null;

    // ---- user_calculations: ترتيب المحافظات (نِسَب نسبية) + العيار الأكثر طلباً ----
    const { data: calcRows } = await supabase
      .from("user_calculations")
      .select("province, karat");

    const provinceCount: Record<string, number> = {};
    const karatCount: Record<string, number> = {};
    for (const row of calcRows ?? []) {
      if (row.province) provinceCount[row.province] = (provinceCount[row.province] || 0) + 1;
      if (row.karat) karatCount[row.karat] = (karatCount[row.karat] || 0) + 1;
    }

    const sortedProvinces = Object.entries(provinceCount).sort((a, b) => b[1] - a[1]);
    const maxProvince = sortedProvinces[0]?.[1] || 1;
    // نِسَب نسبية فقط (بلا أعداد خام حتى لا يُشتقّ الإجمالي)
    const provinceRanking = sortedProvinces.slice(0, 6).map(([province, count]) => ({
      province,
      pct: Math.round((count / maxProvince) * 100),
    }));

    const topKarat =
      Object.entries(karatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return NextResponse.json({
      buyGram,
      sellGram,
      priceSeries,
      marketMovement,
      provinceRanking,
      topKarat,
      lastUpdate,
      isLive,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
