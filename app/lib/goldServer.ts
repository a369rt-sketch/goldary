import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// لقطة سعر الذهب من المصدر الموثوق (gram_prices + dollar_rate) — خادمية فقط.
// يستعملها /api/gold وبوت تيليغرام معاً.
export type GoldSnapshot = {
  ounceUsd: number | null;
  usdToIqd: number;
  numra: number | null;
  buy_gram_21k: number;
  sell_gram_21k: number;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  recordedAt: string;
};

export async function getGoldSnapshot(): Promise<GoldSnapshot | null> {
  const { data: gram } = await supabaseAdmin
    .from("gram_prices")
    .select("buy_gram_iqd, sell_gram_iqd, usd_to_iqd, numra, ounce_usd, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!gram) return null;

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

  return {
    ounceUsd: gram.ounce_usd != null ? Number(gram.ounce_usd) : null,
    usdToIqd,
    numra: gram.numra != null ? Number(gram.numra) : null,
    buy_gram_21k: Math.round(buy21),
    sell_gram_21k: Math.round(sell21),
    price_gram_24k: Math.round(sell21 * (24 / 21)),
    price_gram_22k: Math.round(sell21 * (22 / 21)),
    price_gram_21k: Math.round(sell21),
    recordedAt: gram.recorded_at,
  };
}
