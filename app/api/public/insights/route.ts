import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// مفتاح anon العام فقط — ممنوع منعاً باتاً استعمال SUPABASE_SERVICE_ROLE_KEY هنا
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export async function GET() {
  try {
    // أعمدة محدّدة آمنة فقط — بدون session_id / user_modified / أي بيان فردي
    const { data, error } = await supabase
      .from("user_calculations")
      .select("province, karat, calculated_price, created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];

    const provinceCount: Record<string, number> = {};
    const karatCount: Record<string, number> = {};
    const monthlyCount: Record<string, number> = {};

    // يُحسب داخلياً لأجل المتوسط فقط — لا يُرجَّع
    let totalPrice = 0;
    const count = rows.length;

    rows.forEach((item: any) => {
      provinceCount[item.province] = (provinceCount[item.province] || 0) + 1;
      karatCount[item.karat] = (karatCount[item.karat] || 0) + 1;

      const createdAt = new Date(item.created_at);
      const month = createdAt.toLocaleString("en-US", { month: "short" });
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;

      totalPrice += Number(item.calculated_price || 0);
    });

    const topProvince =
      Object.entries(provinceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "none";

    const topKarat =
      Object.entries(karatCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    const averagePrice = count > 0 ? Math.round(totalPrice / count) : 0;

    const provinceRanking = Object.entries(provinceCount)
      .map(([province, c]) => ({ province, count: c }))
      .sort((a, b) => b.count - a.count);

    const monthlyActivity = monthOrder.map((month) => ({
      month,
      count: monthlyCount[month] || 0,
    }));

    // حصراً الحقول الآمنة — بدون modifiedUsers / recentCalculations / totalCalculations
    return NextResponse.json({
      topProvince,
      topKarat,
      averagePrice,
      provinceRanking,
      monthlyActivity,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
