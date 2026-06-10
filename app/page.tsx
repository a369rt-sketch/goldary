"use client";

import { useState } from "react";
import GoldTicker from "./components/GoldTicker";
import PriceCalculator from "./components/PriceCalculator";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "IQD">("USD");

  const usdToIqd = Number(process.env.NEXT_PUBLIC_USD_TO_IQD ?? 1310);

  return (
    <main className="container">
      <GoldTicker currency={currency} usdToIqd={usdToIqd} />

      <div className="currency-row">
        <span className="label">Currency:</span>
        <button
          type="button"
          className={currency === "USD" ? "pill active" : "pill"}
          onClick={() => setCurrency("USD")}
        >
          USD
        </button>
        <button
          type="button"
          className={currency === "IQD" ? "pill active" : "pill"}
          onClick={() => setCurrency("IQD")}
        >
          IQD
        </button>
      </div>

      <h1>GOLDARY</h1>
      <p className="muted">Curated by Ella Jewels</p>

      <p className="lead">
        Timeless gold pieces, carefully curated for elegance, meaning, and modern taste.
      </p>

      <div className="actions">
        <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
          Calculate Price Now
        </button>

        <button type="button" className="btn-secondary">
          Get It Now
        </button>
      </div>

      <PriceCalculator
        open={isOpen}
        onClose={() => setIsOpen(false)}
        currency={currency}
        usdToIqd={usdToIqd}
      />
    </main>
  );
}
