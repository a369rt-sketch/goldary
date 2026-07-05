import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// لا تخزين مؤقت — كل نداء يسحب سعراً حياً
export const dynamic = "force-dynamic";

// ثوابت المعادلة (كما هي، بدون تغيير المنطق)
const OUNCE_TO_GRAM = 31.1035;
const KARAT_21 = 0.875; // نقاء عيار 21
const NUMRA = 90; // خصم الشراء بالدولار على مستوى الأونصة

export async function GET(req: Request) {
  // 1) الحماية — لازم يطابق CRON_SECRET
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2) المتغيّرات المطلوبة
  const apiKey = process.env.UNIRATE_API_KEY;
  const usd = Number(process.env.NEXT_PUBLIC_USD_TO_IQD);
  if (!apiKey || !Number.isFinite(usd) || usd <= 0) {
    return NextResponse.json({ ok: false, error: "missing env" }, { status: 500 });
  }

  // 3) السحب من UniRate (api_key كـ query param، الحقل rate)
  let ounceUsd: number;
  try {
    const url =
      "https://api.unirateapi.com/api/commodities/rates" +
      `?from=USD&to=XAU&api_key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `unirate http ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    ounceUsd = Number(json?.rate);
  } catch (err) {
    console.error("UniRate fetch failed:", err);
    return NextResponse.json({ ok: false, error: "fetch failed" }, { status: 502 });
  }

  // fallback: rate غير صالح → لا نكتب صفاً، نترك آخر صف صالح
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) {
    return NextResponse.json({ ok: false, error: "invalid rate" }, { status: 502 });
  }

  // 4) الحساب — حرفياً كما اعتُمد (لا تغيير للمنطق)
  const sell_gram_iqd = (ounceUsd * KARAT_21 * usd) / OUNCE_TO_GRAM;
  const buy_gram_iqd = ((ounceUsd - NUMRA) / OUNCE_TO_GRAM) * KARAT_21 * usd;

  // 5) الكتابة عبر service role (يتجاوز RLS)
  const { error } = await supabaseAdmin.from("gram_prices").insert({
    karat: "21",
    buy_gram_iqd: Math.round(buy_gram_iqd),
    sell_gram_iqd: Math.round(sell_gram_iqd),
    usd_to_iqd: usd,
    numra: NUMRA,
    recorded_at: new Date().toISOString(),
  });

  if (error) {
    console.error("gram_prices insert failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ounceUsd,
    buy_gram_iqd: Math.round(buy_gram_iqd),
    sell_gram_iqd: Math.round(sell_gram_iqd),
  });
}
