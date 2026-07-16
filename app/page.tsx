"use client";

import { useEffect, useState } from "react";
import GoldTicker from "./components/GoldTicker";
import PriceCalculator from "./components/PriceCalculator";
import PublicInsights from "./components/PublicInsights";
import ShopsPreview from "./components/ShopsPreview";
import { supabase } from "./lib/supabaseClient";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "IQD">("IQD");
  const [loggedIn, setLoggedIn] = useState(false);

  // حالة تسجيل الدخول — رابط "دخول الصاغة" يظهر لغير المسجّل فقط
  useEffect(() => {
    supabase.auth
      .getUser()
      .then((res: { data: { user: { id?: string } | null } }) =>
        setLoggedIn(!!res.data.user)
      );

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id?: string } } | null) =>
        setLoggedIn(!!session?.user)
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="container">
      {/* شريط علوي صغير فوق اللايف — لغير المسجّل فقط */}
      {!loggedIn && (
        <div className="topbar">
          <a href="/owner/login" className="topbar-link">دخول الصاغة</a>
        </div>
      )}

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
