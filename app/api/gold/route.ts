import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// نقطة JSON العامة الموحّدة لسعر الذهب.
// المصدر الوحيد للحقيقة = جدول gram_prices (يكتبه /api/cron/gold من UniRate + dollar_rate + numra_rate)
// ونفس البيانات التي تقرأها واجهة الموقع (GoldTicker / Insights / Aurum) — لا دولار ثابت ولا معادلة موازية.
// مفيدة أيضاً للمستهلكين الخارجيين مستقبلاً (بوت تيليغرام / تنبيهات — Phase 3).

export const dynamic = "force-dynamic";

export async function GET() {
  // آخر سعر غرام ميداني (عيار 21) — يحمل buy/sell والدولار والنمرة التي حُسب بها
  const { data: gram, error: gramErr } = await supabaseAdmin
    .from("gram_prices")
    .select("buy_gram_iqd, sell_gram_iqd, usd_to_iqd, numra, ounce_usd, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (gramErr) {
    return NextResponse.json(
      { ok: false, error: "gram_prices read failed" },
      { status: 502 }
    );
  }
  if (!gram) {
    // لا تغذية أسعار بعد — لا نختلق رقماً
    return NextResponse.json(
      { ok: false, error: "no price feed yet" },
      { status: 503 }
    );
  }

  // سعر الدولار: نعتمد القيمة التي حُسب بها صف السعر (متسقة مع الأرقام)،
  // ونرجع لأحدث dollar_rate عند غيابها.
  let usdToIqd = Number(gram.usd_to_iqd);
  if (!Number.isFinite(usdToIqd) || usdToIqd <= 0) {
    const { data: dollar } = await supabaseAdmin
      .from("dollar_rate")
      .select("usd_to_iqd")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    usdToIqd = Number(dollar?.usd_to_iqd) || 0;
  }

  const sell21 = Number(gram.sell_gram_iqd) || 0;
  const buy21 = Number(gram.buy_gram_iqd) || 0;
  // اشتقاق عياري 24/22 من سعر بيع عيار 21 (نسبة النقاء) — متسق مع معادلة الكرون.
  const sell24 = sell21 * (24 / 21);
  const sell22 = sell21 * (22 / 21);

  const body = {
    ok: true,
    source: "gram_prices (field)",
    ounceUsd: gram.ounce_usd != null ? Number(gram.ounce_usd) : null,
    usdToIqd,
    numra: gram.numra != null ? Number(gram.numra) : null,

    // أسعار الغرام بالدينار
    buy_gram_21k: Math.round(buy21),
    sell_gram_21k: Math.round(sell21),
    price_gram_24k: Math.round(sell24),
    price_gram_22k: Math.round(sell22),
    price_gram_21k: Math.round(sell21),

    recordedAt: gram.recorded_at, // وقت تسجيل السعر (طزاجة البيانات)
    updatedAt: new Date().toISOString(), // وقت توليد هذا الرد
  };

  // تخزين مؤقت على حافة CDN: يخدم البيانات 60ث ويجدّدها بالخلفية حتى 5 دقائق
  // (مرونة: الرد يبقى سريعاً حتى لو تأخّر الكرون أو تعثّرت القاعدة لحظياً).
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
