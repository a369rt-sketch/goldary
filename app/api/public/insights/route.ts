import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// مفتاح anon العام فقط — ممنوع منعاً باتاً استعمال SUPABASE_SERVICE_ROLE_KEY هنا
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // التجميع كله يتم داخل دالة Supabase get_public_insights()
    // (لها صلاحية execute للـ anon)، فترجّع الحقول الخمسة الآمنة جاهزة:
    // topProvince, topKarat, averagePrice, provinceRanking, monthlyActivity
    const { data, error } = await supabase.rpc("get_public_insights");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
