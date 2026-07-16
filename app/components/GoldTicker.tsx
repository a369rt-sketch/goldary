"use client";

import { useEffect, useMemo, useState } from "react";
import { type Currency } from "@/app/lib/goldPricing";
import { getLatestGramPrice } from "@/app/lib/gramPrices";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  currency: Currency; // "USD" | "IQD"
};

// تنسيق محلي للـticker: الدينار بصيغة "… د.ع"، الدولار بـ"$"
const fmtMoney = (n: number, currency: Currency) =>
  currency === "USD"
    ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Math.round(n).toLocaleString("en-US")} د.ع`;

const DEFAULT_SPREAD = 5000; // fallback لو تعذّر جلب sell_spread_iqd

export default function GoldTicker({ currency }: Props) {
  const [buyGram, setBuyGram] = useState<number | null>(null);
  const [sellGram, setSellGram] = useState<number | null>(null);
  const [sellSpread, setSellSpread] = useState<number>(DEFAULT_SPREAD);
  const [usdToIqd, setUsdToIqd] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [gram, dollar, spread] = await Promise.all([
        getLatestGramPrice(),
        supabase
          .from("dollar_rate")
          .select("usd_to_iqd, recorded_at")
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("numra_rate")
          .select("sell_spread_iqd, recorded_at")
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!alive) return;

      if (gram) {
        setBuyGram(Number(gram.buy_gram_iqd) || 0);
        setSellGram(Number(gram.sell_gram_iqd) || 0);
      }
      if (dollar.data?.usd_to_iqd != null) {
        setUsdToIqd(Number(dollar.data.usd_to_iqd) || 0);
      }
      const sp = Number(spread.data?.sell_spread_iqd);
      setSellSpread(Number.isFinite(sp) && sp >= 0 ? sp : DEFAULT_SPREAD);
      setUpdatedAt(new Date());
    };

    load();
    const id = setInterval(load, 15000); // كل 15 ثانية

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // العرض بالعملة المختارة — الأسعار مخزّنة بالدينار، وللدولار نقسّم على سعر الصرف
  // X = سعر البيع الأساس، Y = X + spread (نطاق البيع). الشراء رقم واحد.
  const prices = useMemo(() => {
    if (buyGram == null || sellGram == null) return null;

    const sellLow = sellGram;
    const sellHigh = sellGram + sellSpread;

    if (currency === "USD") {
      if (!usdToIqd) return null;
      return {
        buy: buyGram / usdToIqd,
        sellLow: sellLow / usdToIqd,
        sellHigh: sellHigh / usdToIqd,
      };
    }

    return { buy: buyGram, sellLow, sellHigh };
  }, [buyGram, sellGram, sellSpread, currency, usdToIqd]);

  const timeText = updatedAt
    ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="ticker">
      <div className="ticker-left">
        <span className="live-dot" />
        <span className="live-text">LIVE</span>
      </div>

      <div className="ticker-mid">Updated {timeText}</div>

      <div className="ticker-right">
        {prices ? (
          <>
            <span>شراء 21K: {fmtMoney(prices.buy, currency)}</span>
            <span>
              بيع 21K: {fmtMoney(prices.sellLow, currency)} – {fmtMoney(prices.sellHigh, currency)}
            </span>
            <span className="ticker-note">
              البيع يختلف بين المحلات حسب المصنعية والموديل
            </span>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>Loading...</span>
        )}
      </div>
    </div>
  );
}
