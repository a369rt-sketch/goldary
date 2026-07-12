"use client";

import { useState } from "react";
import GoldTicker from "./components/GoldTicker";
import PriceCalculator from "./components/PriceCalculator";
import PublicInsights from "./components/PublicInsights";
import ShopsPreview from "./components/ShopsPreview";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "IQD">("USD");

  return (
    <main className="container">
      {/* شريط علوي صغير فوق اللايف */}
      <div className="topbar">
        <a href="/owner/login" className="topbar-link">دخول الصاغة</a>
      </div>

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

      <h1>GOLDARY</h1>
      <p className="muted">Curated by Alaa Raheem</p>

      <p className="lead">
        مرجعك الموثوق لأسعار الذهب وحركة السوق في العراق
      </p>

      <div className="actions">
        <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
          Calculate Price Now
        </button>

        <a href="/return-calculator" className="btn-secondary">
          Investment Calculator
        </a>
      </div>

      {isOpen ? (
        <PriceCalculator
          currency={currency}
          onClose={() => setIsOpen(false)}
        />
      ) : null}

      <ShopsPreview />

      <PublicInsights />
    </main>
  );
}
