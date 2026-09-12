import { NextResponse } from "next/server";
import { getGoldSnapshot } from "@/app/lib/goldServer";

// نقطة JSON العامة الموحّدة لسعر الذهب.
// المصدر الوحيد للحقيقة = getGoldSnapshot (gram_prices + dollar_rate) — نفس ما تقرأه
// الواجهة (GoldTicker / Insights / Aurum) وبوت تيليغرام. لا دولار ثابت ولا معادلة موازية.

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getGoldSnapshot();
  if (!snap) {
    // لا تغذية أسعار بعد — لا نختلق رقماً
    return NextResponse.json({ ok: false, error: "no price feed yet" }, { status: 503 });
  }

  return NextResponse.json(
    {
      ok: true,
      source: "gram_prices (field)",
      ...snap,
      updatedAt: new Date().toISOString(), // وقت توليد هذا الرد
    },
    {
      // تخزين مؤقت على حافة CDN: 60ث + تجديد بالخلفية حتى 5 دقائق (مرونة)
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}
