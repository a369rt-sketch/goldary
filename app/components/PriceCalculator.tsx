"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { type Condition, type Currency, fmt } from "@/app/lib/goldPricing";
import { getLatestGramPrice } from "@/app/lib/gramPrices";
import { provinces } from "@/app/lib/provinces";

type Props = {
  currency: Currency;
  onClose?: () => void;
};

type Mode = "buy" | "sell";

export default function PriceCalculator({ currency, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("sell");
  const [condition, setCondition] = useState<Condition>("new");
  const karat = "21K";
  const [weight, setWeight] = useState<string>("2");
  const [laborUsd, setLaborUsd] = useState<string>("1");
  const [profit, setProfit] = useState<string>("0");
  const [dollarPrice, setDollarPrice] = useState<string>("");
  const [province, setProvince] = useState<string>("qadisiyyah");

  // سعر الغرام الميداني (عيار 21) — آخر صف من gram_prices
  const [buyGram, setBuyGram] = useState<number>(0);
  const [sellGram, setSellGram] = useState<number>(0);

  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // سعر الدولار من جدول dollar_rate (لتحويل الأجرة دولار→دينار)
  useEffect(() => {
    async function loadDollar() {
      const { data: row, error } = await supabase
        .from("dollar_rate")
        .select("usd_to_iqd, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && row?.usd_to_iqd != null) {
        setDollarPrice(String(row.usd_to_iqd));
      }
      // لو ماكو صف: يبقى فارغاً
    }

    loadDollar();
  }, []);

  // سعر شراء/بيع الغرام الحقيقي (آخر صف ميداني)
  useEffect(() => {
    let mounted = true;

    async function loadGram() {
      const row = await getLatestGramPrice();
      if (!mounted || !row) return;
      setBuyGram(Number(row.buy_gram_iqd) || 0);
      setSellGram(Number(row.sell_gram_iqd) || 0);
    }

    loadGram();

    return () => {
      mounted = false;
    };
  }, []);

  // سعر الغرام الأساس بالدينار = بيع/شراء الحقيقي حسب نوع العملية
  const gramPriceIqd = useMemo(
    () => (mode === "sell" ? sellGram : buyGram),
    [mode, sellGram, buyGram]
  );

  // نفس القيمة بالعملة المختارة (للتحليلات فقط؛ العرض دائماً بالدينار)
  const gramPrice = useMemo(() => {
    if (currency !== "USD") return gramPriceIqd;
    const usd = parseFloat(dollarPrice) || 0;
    return usd ? gramPriceIqd / usd : 0;
  }, [currency, gramPriceIqd, dollarPrice]);

  const total = useMemo(() => {
    const goldCost = gramPrice * (Number(weight) || 0);

    let labor = 0;
    if (mode === "sell" && condition === "new") {
      const laborPerGram =
        currency === "IQD"
          ? (Number(laborUsd) || 0) * (Number(dollarPrice) || 0)
          : Number(laborUsd) || 0;
      labor = laborPerGram * (Number(weight) || 0);
    }

    const profitFactor = mode === "sell" ? 1 + (Number(profit) || 0) / 100 : 1;

    return (goldCost + labor) * profitFactor;
  }, [
    gramPrice,
    weight,
    laborUsd,
    profit,
    currency,
    dollarPrice,
    mode,
    condition,
  ]);

  // الإجمالي المعروض دائماً بالدينار (المستخدم عراقي)
  const totalIqd = useMemo(() => {
    const goldCost = gramPriceIqd * (Number(weight) || 0);

    let labor = 0;
    if (mode === "sell" && condition === "new") {
      labor =
        (Number(laborUsd) || 0) * (Number(dollarPrice) || 0) * (Number(weight) || 0);
    }

    const profitFactor = mode === "sell" ? 1 + (Number(profit) || 0) / 100 : 1;

    return (goldCost + labor) * profitFactor;
  }, [gramPriceIqd, weight, mode, condition, laborUsd, dollarPrice, profit]);

  useEffect(() => {
    if (!total || total <= 0) return;

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            province,
            karat,
            operation_type: mode,
            item_condition: condition,
            weight: Number(weight) || 0,
            manufacturing_fee: Number(laborUsd) || 0,
            profit_percent: Number(profit) || 0,
            market_factor: null,
            calculated_price: total,
            currency,
            user_modified: Number(profit) > 0 || Number(laborUsd) > 1,
            session_id: sessionId,
          }),
        });
      } catch (err) {
        console.error("Analytics failed:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    province,
    karat,
    mode,
    condition,
    weight,
    laborUsd,
    profit,
    total,
    currency,
    sessionId,
  ]);

  return (
    <div className="calc">
      {onClose && (
        <div className="row-between" style={{ marginBottom: 12 }}>
          <strong>حاسبة السعر</strong>
          <button
            type="button"
            className="small-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕ إغلاق
          </button>
        </div>
      )}

      <div className="calc-prices">
        <div className="calc-prices-row">
          <div>الشراء (المحل يشتري منك)</div>
          <div>21K: {buyGram ? fmt(buyGram, "IQD") : "--"}</div>
        </div>

        <div className="calc-prices-row">
          <div>البيع</div>
          <div>21K: {sellGram ? fmt(sellGram, "IQD") : "--"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>نوع العملية</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="buy">شراء</option>
          <option value="sell">بيع</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>المحافظة</label>
        <select value={province} onChange={(e) => setProvince(e.target.value)}>
          {provinces.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
        <p className="muted small" style={{ marginTop: 4 }}>
          للإحصاء فقط — لا يؤثر على السعر حالياً.
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>العيار</label>
        <div>21K</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>سعر الدولار</label>
        <input
          type="number"
          value={dollarPrice}
          min={0}
          step={1}
          onChange={(e) => setDollarPrice(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>الوزن (غرام)</label>
        <input
          type="number"
          value={weight}
          min={0}
          step={0.1}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      {mode === "sell" && (
        <div style={{ marginTop: 12 }}>
          <label>حالة القطعة</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
          >
            <option value="new">جديد</option>
            <option value="used">مستعمل</option>
          </select>
        </div>
      )}

      {mode === "sell" && condition === "new" && (
        <div style={{ marginTop: 12 }}>
          <label>أجرة الصياغة لكل غرام (USD)</label>
          <input
            type="number"
            value={laborUsd}
            min={0}
            step={0.1}
            onChange={(e) => setLaborUsd(e.target.value)}
          />
        </div>
      )}

      {mode === "sell" && (
        <div style={{ marginTop: 12 }}>
          <label>ربح % (اختياري)</label>
          <input
            type="number"
            value={profit}
            min={0}
            step={1}
            onChange={(e) => setProfit(e.target.value)}
          />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div>سعر الغرام المعتمد: {fmt(gramPriceIqd, "IQD")}</div>
      </div>

      <div style={{ marginTop: 12, fontWeight: 700 }}>
        الإجمالي: {fmt(totalIqd, "IQD")}
      </div>
    </div>
  );
}
