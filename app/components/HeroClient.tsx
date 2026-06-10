"use client";

import { useMemo, useState } from "react";
import GoldTicker from "./GoldTicker";
import PriceCalculator from "./PriceCalculator";

export default function HeroClient() {
  const [currency, setCurrency] = useState<"USD" | "IQD">("USD");
  const [openCalc, setOpenCalc] = useState(false);

  const usdToIqd = useMemo(() => {
    const n = Number(process.env.NEXT_PUBLIC_USD_TO_IQD);
    return Number.isFinite(n) && n > 0 ? n : 1310;
  }, []);

  return (
    <main style={{ padding: "80px", maxWidth: "900px", margin: "0 auto" }}>
      <GoldTicker currency={currency} usdToIqd={usdToIqd} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span className="muted small">Currency:</span>
        <button
          className={`small-btn ${currency === "USD" ? "active" : ""}`}
          onClick={() => setCurrency("USD")}
          type="button"
        >
          USD
        </button>
        <button
          className={`small-btn ${currency === "IQD" ? "active" : ""}`}
          onClick={() => setCurrency("IQD")}
          type="button"
        >
          IQD
        </button>
      </div>

      <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>GOLDARY</h1>

      <p style={{ opacity: 0.7, marginBottom: "30px" }}>Curated by Ella Jewels</p>

      <p style={{ fontSize: "18px", lineHeight: "1.6", marginBottom: "40px" }}>
        Timeless gold pieces, carefully curated for elegance, meaning, and modern taste.
      </p>

      <div style={{ display: "flex", gap: "16px" }}>
        <button className="btn-primary" onClick={() => setOpenCalc(true)} type="button">
          Calculate Price Now
        </button>

        <button className="btn-secondary" type="button">
          Get It Now
        </button>
      </div>

      {openCalc ? (
        <PriceCalculator
          currency={currency}
          usdToIqd={usdToIqd}
          onClose={() => setOpenCalc(false)}
        />
      ) : null}
    </main>
  );
}
