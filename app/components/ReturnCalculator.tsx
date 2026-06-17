"use client";

import { useEffect, useMemo, useState } from "react";
import { type GoldData, fmt } from "@/app/lib/goldPricing";

type Karat = "24K" | "22K" | "21K" | "18K";

export default function ReturnCalculator() {
  const [data, setData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [karat, setKarat] = useState<Karat>("21K");
  const [grams, setGrams] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  // جلب السعر الحالي من api/gold (نفس نمط GoldTicker)
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/gold", { cache: "no-store" });
        const json = await res.json();
        if (!mounted) return;
        if (json?.error) {
          setFailed(true);
          setLoading(false);
          return;
        }
        setData(json as GoldData);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error("ReturnCalculator fetch failed:", err);
        setFailed(true);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // السعر الحالي للغرام بالدينار حسب العيار (18K مشتق من 24K × 18/24)
  const currentGramPrice = useMemo(() => {
    if (!data) return 0;
    const g24 = Number(data.price_gram_24k ?? 0);
    if (karat === "24K") return g24;
    if (karat === "22K") return Number(data.price_gram_22k ?? 0);
    if (karat === "21K") return Number(data.price_gram_21k ?? 0);
    return Math.round(g24 * (18 / 24)); // 18K
  }, [data, karat]);

  const result = useMemo(() => {
    const totalCost = grams * purchasePrice;
    const currentValue = grams * currentGramPrice;
    const profit = currentValue - totalCost;
    const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    // العائد السنوي (CAGR) — فقط إذا التاريخ صالح وبالماضي
    let annualizedPct: number | null = null;
    if (purchaseDate) {
      const ts = Date.parse(purchaseDate);
      if (!Number.isNaN(ts)) {
        const years =
          (Date.now() - ts) / (1000 * 60 * 60 * 24 * 365.25);
        if (years > 0 && totalCost > 0 && currentValue > 0) {
          annualizedPct =
            (Math.pow(currentValue / totalCost, 1 / years) - 1) * 100;
        }
      }
    }

    return { totalCost, currentValue, profit, profitPct, annualizedPct };
  }, [grams, purchasePrice, currentGramPrice, purchaseDate]);

  const profitColor = result.profit >= 0 ? "var(--gold2)" : "var(--danger)";
  const sign = result.profit > 0 ? "+" : "";

  return (
    <div className="card">
      <div className="card-body" style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="label">العيار</label>
          <select
            className="input"
            value={karat}
            onChange={(e) => setKarat(e.target.value as Karat)}
          >
            <option value="24K">24K</option>
            <option value="22K">22K</option>
            <option value="21K">21K</option>
            <option value="18K">18K</option>
          </select>
        </div>

        <div>
          <label className="label">عدد الغرامات</label>
          <input
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">سعر الشراء للغرام (دينار)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">تاريخ الشراء (اختياري)</label>
          <input
            className="input"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="tiny muted">
          {loading
            ? "جارٍ تحميل السعر الحالي…"
            : failed
            ? "تعذّر جلب السعر الحالي، حاول لاحقاً"
            : `السعر الحالي للغرام (${karat}): ${fmt(currentGramPrice, "IQD")}`}
        </div>

        <div className="panel" style={{ display: "grid", gap: 8 }}>
          <div className="row-between">
            <span className="muted">التكلفة الكلية</span>
            <span>{fmt(result.totalCost, "IQD")}</span>
          </div>

          <div className="row-between">
            <span className="muted">القيمة الحالية</span>
            <span>{fmt(result.currentValue, "IQD")}</span>
          </div>

          <div className="row-between" style={{ fontWeight: 700 }}>
            <span>الربح / الخسارة</span>
            <span style={{ color: profitColor }}>
              {sign}
              {fmt(result.profit, "IQD")}
            </span>
          </div>

          <div className="row-between">
            <span className="muted">نسبة الربح / الخسارة</span>
            <span style={{ color: profitColor }}>
              {sign}
              {result.profitPct.toFixed(2)}%
            </span>
          </div>

          {result.annualizedPct != null && (
            <div className="row-between">
              <span className="muted">العائد السنوي</span>
              <span
                style={{
                  color:
                    result.annualizedPct >= 0
                      ? "var(--gold2)"
                      : "var(--danger)",
                }}
              >
                {result.annualizedPct > 0 ? "+" : ""}
                {result.annualizedPct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
