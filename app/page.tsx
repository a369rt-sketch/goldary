"use client";

import GoldTicker from "./components/GoldTicker";
import Hero from "./components/Hero";
import PublicInsights from "./components/PublicInsights";
import ShopsPreview from "./components/ShopsPreview";
import { useCurrency } from "./lib/currency";

export default function Home() {
  // العملة مشتركة مع مبدّل الـHeader (localStorage + event)
  const [currency, setCurrency] = useCurrency();

  return (
    <main className="container">
      <GoldTicker currency={currency} />

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

      <Hero />

      <ShopsPreview />

      <PublicInsights />
    </main>
  );
}
