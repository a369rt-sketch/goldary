"use client";

import { useEffect, useMemo, useState } from "react";
import { type Currency, type GoldData, fmt, getBaseIqd, getBaseUsd } from "@/app/lib/goldPricing";

type Props = {
  currency: Currency; // "USD" | "IQD"
  usdToIqd: number;
};

export default function GoldTicker({ currency, usdToIqd }: Props) {
  const [data, setData] = useState<GoldData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/gold", { cache: "no-store" });
        const json = (await res.json()) as GoldData;
        if (!alive) return;
        setData(json);
        setUpdatedAt(new Date());
      } catch (e) {
        console.error("Gold fetch failed", e);
      }
    };

    load();
    const id = setInterval(load, 15000); // كل 15 ثانية ✅

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const prices = useMemo(() => {
    if (!data) return null;

    if (currency === "USD") {
      const usd = getBaseUsd(data);
      return { k24: usd.usd24, k22: usd.usd22, k21: usd.usd21 };
    }

    const iqd = getBaseIqd(data);
    return { k24: iqd.iqd24, k22: iqd.iqd22, k21: iqd.iqd21 };
  }, [data, currency, usdToIqd]);

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
            <span>24K: {fmt(prices.k24, currency)}</span>
            <span>22K: {fmt(prices.k22, currency)}</span>
            <span>21K: {fmt(prices.k21, currency)}</span>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>Loading...</span>
        )}
      </div>
    </div>
  );
}