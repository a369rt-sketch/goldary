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

      return NextResponse.json({
        totalCalculations,
        topProvince,
        topKarat,
        averagePrice,
        modifiedUsers,
        provinceRanking,
        monthlyActivity,
        recentCalculations,
      });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}