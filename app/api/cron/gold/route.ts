import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// لا تخزين مؤقت — كل نداء يسحب سعراً حياً
export const dynamic = "force-dynamic";

// ثوابت المعادلة (كما هي، بدون تغيير المنطق)
const OUNCE_TO_GRAM = 31.1035;
const KARAT_21 = 0.875; // نقاء عيار 21
// ملاحظة: usd و numra يُقرآن من قاعدة البيانات (dollar_rate و numra_rate) لكل نداء

export async function GET(req: Request) {
  // 1) الحماية — لازم يطابق CRON_SECRET
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2) سحب سعر الأونصة (XAU/USD) — goldapi.io أساسي، ثم مصدر مجاني احتياطي
  //     (UniRate أُلغي: باقته المجانية لم تعد تعطي المعادن الثمينة)
  let ounceUsd = NaN;
  let priceSource = "";

  const goldApiKey = process.env.GOLD_API_KEY;
  if (goldApiKey) {
    try {
      const r = await fetch("https://www.goldapi.io/api/XAU/USD", {
        headers: { "x-access-token": goldApiKey, "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (r.ok) {
        const v = Number((await r.json())?.price);
        if (Number.isFinite(v) && v > 0) {
          ounceUsd = v;
          priceSource = "goldapi.io";
        }
      }
    } catch (err) {
      console.error("goldapi.io fetch failed:", err);
    }
  }

  // مصدر مجاني احتياطي بلا مفتاح
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) {
    try {
      const r = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
      if (r.ok) {
        const v = Number((await r.json())?.price);
        if (Number.isFinite(v) && v > 0) {
          ounceUsd = v;
          priceSource = "gold-api.com";
        }
      }
    } catch (err) {
      console.error("gold-api.com fetch failed:", err);
    }
  }

  // فشل كل المصادر → لا نكتب صفاً، نترك آخر صف صالح
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) {
    return NextResponse.json(
      { ok: false, error: "all price sources failed" },
      { status: 502 }
    );
  }

  // 4) قراءة سعر الدولار من dollar_rate (آخر صف) — تُستعمل كما هي بدون تحويل
  const { data: dollarRow, error: dollarErr } = await supabaseAdmin
    .from("dollar_rate")
    .select("usd_to_iqd, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const usd = Number(dollarRow?.usd_to_iqd);
  if (dollarErr || !Number.isFinite(usd) || usd <= 0) {
    console.error("dollar_rate read failed/empty:", dollarErr?.message);
    return NextResponse.json({ ok: false, error: "no dollar_rate" }, { status: 502 });
  }

  // 5) قراءة النمرة من numra_rate (آخر صف) — تُستعمل كما هي بدون تحويل
  const { data: numraRow, error: numraErr } = await supabaseAdmin
    .from("numra_rate")
    .select("numra, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const numra = Number(numraRow?.numra);
  if (numraErr || !Number.isFinite(numra)) {
    console.error("numra_rate read failed/empty:", numraErr?.message);
    return NextResponse.json({ ok: false, error: "no numra_rate" }, { status: 502 });
  }

  // 6) الحساب — حرفياً كما اعتُمد (لا تغيير للمنطق)، usd و numra من الجدولين
  const sell_gram_iqd = (ounceUsd * KARAT_21 * usd) / OUNCE_TO_GRAM;
  const buy_gram_iqd = ((ounceUsd - numra) / OUNCE_TO_GRAM) * KARAT_21 * usd;

  // 7) الكتابة عبر service role (يتجاوز RLS) — نوثّق كل صف بالقيم التي حُسب بها
  const { error } = await supabaseAdmin.from("gram_prices").insert({
    karat: "21",
    buy_gram_iqd: Math.round(buy_gram_iqd),
    sell_gram_iqd: Math.round(sell_gram_iqd),
    usd_to_iqd: usd,
    numra: numra,
    ounce_usd: ounceUsd,
    recorded_at: new Date().toISOString(),
  });

  if (error) {
    console.error("gram_prices insert failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    source: priceSource,
    ounceUsd,
    buy_gram_iqd: Math.round(buy_gram_iqd),
    sell_gram_iqd: Math.round(sell_gram_iqd),
  });
}
