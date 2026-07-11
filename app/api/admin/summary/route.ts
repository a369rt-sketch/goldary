import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
  .from("user_calculations")
  .select("*")
  .order("created_at", { ascending: false });

  const recentCalculations = (data || []).slice(0, 5).map((item: any) => ({
    province: item.province,
    karat: item.karat,
    operation_type: item.operation_type,
    calculated_price: item.calculated_price,
    created_at: item.created_at,
  }));

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const totalCalculations = data.length;

    const provinceCount: Record<string, number> = {};
    const karatCount: Record<string, number> = {};
    const monthlyCount: Record<string, number> = {};

    let modifiedUsers = 0;
    let totalPrice = 0;

    data.forEach((item: any) => {
      provinceCount[item.province] =
        (provinceCount[item.province] || 0) + 1;

      karatCount[item.karat] =
        (karatCount[item.karat] || 0) + 1;
        const createdAt = new Date(item.created_at);
        const month = createdAt.toLocaleString("en-US", { month: "short" });
        
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      if (item.user_modified) {
        modifiedUsers++;
      }

      totalPrice += Number(item.calculated_price || 0);
    });

    // نسب التغيّر: آخر 30 يوم (A) مقابل الـ30 يوم اللي قبلها (B)
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const winA = { count: 0, sum: 0, modified: 0 };
    const winB = { count: 0, sum: 0, modified: 0 };

    data.forEach((item: any) => {
      const t = new Date(item.created_at).getTime();
      if (!Number.isFinite(t)) return;
      const age = now - t;
      const bucket =
        age >= 0 && age < 30 * DAY
          ? winA
          : age >= 30 * DAY && age < 60 * DAY
          ? winB
          : null;
      if (!bucket) return;
      bucket.count++;
      bucket.sum += Number(item.calculated_price || 0);
      if (item.user_modified) bucket.modified++;
    });

    // نسبة مئوية مقرّبة لخانة عشرية، أو null إذا القاعدة (previous) صفر/غير متاح
    const pctChange = (curr: number, prev: number): number | null =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null;

    const avgA = winA.count > 0 ? winA.sum / winA.count : 0;
    const avgB = winB.count > 0 ? winB.sum / winB.count : 0;
    const rateA = winA.count > 0 ? winA.modified / winA.count : 0;
    const rateB = winB.count > 0 ? winB.modified / winB.count : 0;

    const totalChange = pctChange(winA.count, winB.count);
    const avgChange = winB.count > 0 ? pctChange(avgA, avgB) : null;
    const modifiedChange = pctChange(winA.modified, winB.modified);
    const customizationChange = winB.count > 0 ? pctChange(rateA, rateB) : null;

    const topProvince =
      Object.entries(provinceCount).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "none";

    const topKarat =
      Object.entries(karatCount).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "none";

    const averagePrice =
      totalCalculations > 0
        ? Math.round(totalPrice / totalCalculations)
        : 0;

        const provinceRanking = Object.entries(provinceCount)
        .map(([province, count]) => ({
          province,
          count,
        }))
        .sort((a, b) => b.count - a.count);
      
        const monthOrder = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          
          const monthlyActivity = monthOrder.map((month) => ({
            month,
            count: monthlyCount[month] || 0,
          }));

      // Live System: آخر تحديث فعلي من gram_prices (تغذية الكرون)
      const { data: lastGram } = await supabase
        .from("gram_prices")
        .select("recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastUpdate = lastGram?.recorded_at ?? null;
      const minutesSince = lastUpdate
        ? (Date.now() - new Date(lastUpdate).getTime()) / 60000
        : null;
      const isLive = minutesSince != null && minutesSince <= 30; // هامش آمن لكرون 15د

      // Market Movement + Sparkline: سلسلة أسعار gram_prices لآخر 30 يوم (قراءة فقط)
      const since = new Date(now - 30 * DAY).toISOString();
      const { data: priceRows } = await supabase
        .from("gram_prices")
        .select("recorded_at, sell_gram_iqd")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });

      const rawSeries = (priceRows ?? [])
        .map((r: any) => Number(r.sell_gram_iqd))
        .filter((n: number) => Number.isFinite(n));

      // downsample لأقصى ~40 نقطة مع الحفاظ على أول/آخر نقطة
      const MAX_POINTS = 40;
      let priceSeries = rawSeries;
      if (rawSeries.length > MAX_POINTS) {
        const step = (rawSeries.length - 1) / (MAX_POINTS - 1);
        priceSeries = Array.from({ length: MAX_POINTS }, (_, i) =>
          rawSeries[Math.round(i * step)]
        );
      }

      // نسبة الحركة = (آخر − أول)/أول ×100، أو null (حماية القسمة على صفر/نقص بيانات)
      const marketMovement =
        rawSeries.length >= 2 && rawSeries[0] > 0
          ? Math.round(
              ((rawSeries[rawSeries.length - 1] - rawSeries[0]) / rawSeries[0]) *
                1000
            ) / 10
          : null;

      return NextResponse.json({
        totalCalculations,
        topProvince,
        topKarat,
        averagePrice,
        modifiedUsers,
        provinceRanking,
        monthlyActivity,
        recentCalculations,
        lastUpdate,
        isLive,
        totalChange,
        avgChange,
        modifiedChange,
        customizationChange,
        priceSeries,
        marketMovement,
      });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}