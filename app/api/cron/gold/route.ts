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

  // 2) المتغيّرات المطلوبة
  const apiKey = process.env.UNIRATE_API_KEY;
  if (!apiKey) {
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
    ounceUsd,
    buy_gram_iqd: Math.round(buy_gram_iqd),
    sell_gram_iqd: Math.round(sell_gram_iqd),
  });
}
