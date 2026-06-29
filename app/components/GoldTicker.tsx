"use client";

import { useEffect, useMemo, useState } from "react";
import { type Currency, fmt } from "@/app/lib/goldPricing";
import { getLatestGramPrice } from "@/app/lib/gramPrices";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  currency: Currency; // "USD" | "IQD"
};

export default function GoldTicker({ currency }: Props) {
  const [buyGram, setBuyGram] = useState<number | null>(null);
  const [sellGram, setSellGram] = useState<number | null>(null);
  const [usdToIqd, setUsdToIqd] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [gram, dollar] = await Promise.all([
        getLatestGramPrice(),
        supabase
          .from("dollar_rate")
          .select("usd_to_iqd, recorded_at")
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
  const prices = useMemo(() => {
    if (buyGram == null || sellGram == null) return null;

    if (currency === "USD") {
      if (!usdToIqd) return null;
      return { buy: buyGram / usdToIqd, sell: sellGram / usdToIqd };
    }

    return { buy: buyGram, sell: sellGram };
  }, [buyGram, sellGram, currency, usdToIqd]);

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
            <span>شراء 21K: {fmt(prices.buy, currency)}</span>
            <span>بيع 21K: {fmt(prices.sell, currency)}</span>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>Loading...</span>
        )}
      </div>
    </div>
  );
}
