"use client";

import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/app/lib/goldPricing";
import { getLatestGramPrice } from "@/app/lib/gramPrices";

type Karat = "24K" | "22K" | "21K" | "18K";

const KARAT_NUM: Record<Karat, number> = {
  "24K": 24,
  "22K": 22,
  "21K": 21,
  "18K": 18,
};

export default function ReturnCalculator() {
  // سعر شراء الغرام 21K الحي من gram_prices (السعر الحقيقي الوحيد)
  const [buy21, setBuy21] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [karat, setKarat] = useState<Karat>("21K");
  const [grams, setGrams] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  // جلب سعر الشراء 21K الحي (نفس مصدر بطاقة LIVE)
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const gram = await getLatestGramPrice();
        if (!mounted) return;
        const buy = Number(gram?.buy_gram_iqd);
        if (!gram || !Number.isFinite(buy) || buy <= 0) {
          setFailed(true);
          setLoading(false);
          return;
        }
        setBuy21(buy);
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

  // 21K = السعر الحقيقي؛ باقي العيارات تُشتق بنسب النقاء (base24 = buy21 / 0.875)
  const currentGramPrice = useMemo(() => {
    if (buy21 == null) return 0;
    if (karat === "21K") return buy21;
    const base24 = buy21 / 0.875;
    return Math.round(base24 * (KARAT_NUM[karat] / 24));
  }, [buy21, karat]);

  const isApprox = karat !== "21K"; // العيارات المشتقة تحتاج وسماً صريحاً

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
          {loading ? (
            "جارٍ تحميل السعر الحالي…"
          ) : failed ? (
            <span>السعر الحالي للغرام: — · تعذر جلب السعر الحالي</span>
          ) : (
            <>
              السعر الحالي للغرام ({karat}): {fmt(currentGramPrice, "IQD")}
              {isApprox && (
                <span
                  style={{
                    marginInlineStart: 8,
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(215,180,90,0.5)",
                    color: "var(--gold2)",
                    fontSize: 11,
                  }}
                >
                  تقريبي — محوّل من عيار 21
                </span>
              )}
            </>
          )}
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
