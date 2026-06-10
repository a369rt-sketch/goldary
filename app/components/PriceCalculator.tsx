"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import {
  type Condition,
  type Currency,
  getBaseIqd,
  fmt,
  type GoldData,
} from "@/app/lib/goldPricing";
import { provinces } from "@/app/lib/provinces";

type Props = {
  currency: Currency;
  usdToIqd?: number;
  data?: GoldData;
};

type Mode = "buy" | "sell";
type Karat = "24K" | "22K" | "21K" | "18K";

const KARAT_FACTOR: Record<Karat, number> = {
  "24K": 0.999,
  "22K": 0.916,
  "21K": 0.875,
  "18K": 0.75,
};

const OUNCE_TO_GRAM = 31.1035;

type ProvinceMarketFactor = {
  province_key: string;
  province_name: string;
  buy_factor: number;
  sell_new_factor: number;
  sell_used_factor: number;
};

export default function PriceCalculator({
  currency,
  usdToIqd = 0,
  data,
}: Props) {
  const [liveData, setLiveData] = useState<GoldData | null>(data ?? null);
  const [marketFactors, setMarketFactors] = useState<ProvinceMarketFactor[]>([]);

  const [mode, setMode] = useState<Mode>("sell");
  const [condition, setCondition] = useState<Condition>("new");
  const [karat, setKarat] = useState<Karat>("24K");
  const [weight, setWeight] = useState<number>(2);
  const [laborUsd, setLaborUsd] = useState<number>(1);
  const [profit, setProfit] = useState<number>(0);
  const [dollarPrice, setDollarPrice] = useState<number>(1310);
  const [province, setProvince] = useState<string>("qadisiyyah");
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    async function loadFactors() {
      const { data: factors, error } = await supabase
        .from("province_market_factors")
        .select("*");

      if (!error && factors) {
        setMarketFactors(factors);
      }

      if (error) {
        console.error("Factors fetch failed:", error);
      }
    }

    loadFactors();
  }, []);

  const provinceFactors = useMemo(() => {
    return marketFactors.find((p) => p.province_key === province);
  }, [marketFactors, province]);


  useEffect(() => {
    let mounted = true;

    async function loadGold() {
      try {
        const res = await fetch("/api/gold", { cache: "no-store" });
        const json = await res.json();

        if (!mounted) return;
        if (json?.error) return;

        setLiveData(json);
      } catch (err) {
        console.error("PriceCalculator fetch failed:", err);
      }
    }

    loadGold();

    return () => {
      mounted = false;
    };
  }, []);

  const actualData = liveData ?? data ?? null;
  const effectiveUsdToIqd = Number(actualData?.usdToIqd ?? usdToIqd ?? 0);

  const baseIqd = useMemo(() => getBaseIqd(actualData), [actualData]);
const selectedMarket = marketFactors.find(
  (item) => item.province_key === province
);

const buyFactor = selectedMarket?.buy_factor ?? 1;
const sellNewFactor = selectedMarket?.sell_new_factor ?? 1;
const sellUsedFactor = selectedMarket?.sell_used_factor ?? 1;

  const local = useMemo(() => {
    return {
      buy: {
        iqd24: Math.round(baseIqd.iqd24 * buyFactor),
        iqd22: Math.round(baseIqd.iqd22 * buyFactor),
        iqd21: Math.round(baseIqd.iqd21 * buyFactor),
      },
      sellNew: {
        iqd24: Math.round(baseIqd.iqd24 * sellNewFactor),
        iqd22: Math.round(baseIqd.iqd22 * sellNewFactor),
        iqd21: Math.round(baseIqd.iqd21 * sellNewFactor),
      },
      sellUsed: {
        iqd24: Math.round(baseIqd.iqd24 * sellUsedFactor),
        iqd22: Math.round(baseIqd.iqd22 * sellUsedFactor),
        iqd21: Math.round(baseIqd.iqd21 * sellUsedFactor),
      },
    };
  }, [baseIqd, buyFactor, sellNewFactor, sellUsedFactor]);

  const ounceUsd = Number(actualData?.ounceUsd ?? 0);

  const gramPrice = useMemo(() => {
    // وضع البيع: المعادلة الجديدة المعتمدة على سعر الدولار والبورصة
    if (mode === "sell") {
      if (!dollarPrice || !ounceUsd) return 0;

      // سعر الغرام بالدينار = (سعر الدولار × معامل العيار × البورصة) ÷ غرامات الأونصة
      const gramIqd =
        (dollarPrice * KARAT_FACTOR[karat] * ounceUsd) / OUNCE_TO_GRAM;

      return currency === "USD" ? gramIqd / dollarPrice : gramIqd;
    }

    // وضع الشراء: يبقى بالمنطق الحالي (معاملات المحافظة)
    if (currency === "USD") {
      if (!effectiveUsdToIqd) return 0;
      if (karat === "24K") return local.buy.iqd24 / effectiveUsdToIqd;
      if (karat === "22K") return local.buy.iqd22 / effectiveUsdToIqd;
      return local.buy.iqd21 / effectiveUsdToIqd;
    }

    if (karat === "24K") return local.buy.iqd24;
    if (karat === "22K") return local.buy.iqd22;
    return local.buy.iqd21;
  }, [currency, mode, karat, local, ounceUsd, dollarPrice, effectiveUsdToIqd]);

  const total = useMemo(() => {
    const goldCost = gramPrice * weight;

    let labor = 0;

    if (mode === "sell" && condition === "new") {
      const laborPerGram =
        currency === "IQD" ? laborUsd * effectiveUsdToIqd : laborUsd;
      labor = laborPerGram * weight;
    }

    const profitFactor = mode === "sell" ? 1 + (Number(profit) || 0) / 100 : 1;

    return (goldCost + labor) * profitFactor;
  }, [
    gramPrice,
    weight,
    laborUsd,
    profit,
    currency,
    effectiveUsdToIqd,
    mode,
    condition,
  ]);

  // قيم العرض بالدينار دائماً (مستقلة عن مفتاح USD/IQD) — المستخدم عراقي
  const gramPriceIqd = useMemo(() => {
    if (mode === "sell") {
      if (!dollarPrice || !ounceUsd) return 0;
      return (dollarPrice * KARAT_FACTOR[karat] * ounceUsd) / OUNCE_TO_GRAM;
    }

    if (karat === "24K") return local.buy.iqd24;
    if (karat === "22K") return local.buy.iqd22;
    return local.buy.iqd21;
  }, [mode, dollarPrice, ounceUsd, karat, local]);

  const totalIqd = useMemo(() => {
    const goldCost = gramPriceIqd * weight;

    let labor = 0;
    if (mode === "sell" && condition === "new") {
      labor = laborUsd * effectiveUsdToIqd * weight;
    }

    const profitFactor = mode === "sell" ? 1 + (Number(profit) || 0) / 100 : 1;

    return (goldCost + labor) * profitFactor;
  }, [
    gramPriceIqd,
    weight,
    mode,
    condition,
    laborUsd,
    effectiveUsdToIqd,
    profit,
  ]);

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
            weight,
            manufacturing_fee: laborUsd,
            profit_percent: profit,
            market_factor:
              mode === "buy"
                ? buyFactor
                : condition === "new"
                ? sellNewFactor
                : sellUsedFactor,
            calculated_price: total,
            currency,
            user_modified:
  Number(profit) > 0 ||
  Number(laborUsd) > 1,
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
    buyFactor,
    sellNewFactor,
    sellUsedFactor,
    total,
    currency,
    sessionId,
  ]);

  return (
    <div className="calc">
      <div className="calc-prices">
        <div className="calc-prices-row">
          <div>الشراء (المحل يشتري منك)</div>
          <div>
            24K: {local.buy.iqd24 ? fmt(local.buy.iqd24, "IQD") : "--"} | 22K:{" "}
            {local.buy.iqd22 ? fmt(local.buy.iqd22, "IQD") : "--"} | 21K:{" "}
            {local.buy.iqd21 ? fmt(local.buy.iqd21, "IQD") : "--"}
          </div>
        </div>

        <div className="calc-prices-row">
          <div>البيع جديد</div>
          <div>
            24K: {local.sellNew.iqd24 ? fmt(local.sellNew.iqd24, "IQD") : "--"} | 22K:{" "}
            {local.sellNew.iqd22 ? fmt(local.sellNew.iqd22, "IQD") : "--"} | 21K:{" "}
            {local.sellNew.iqd21 ? fmt(local.sellNew.iqd21, "IQD") : "--"}
          </div>
        </div>

        <div className="calc-prices-row">
          <div>البيع مستعمل</div>
          <div>
            24K: {local.sellUsed.iqd24 ? fmt(local.sellUsed.iqd24, "IQD") : "--"} | 22K:{" "}
            {local.sellUsed.iqd22 ? fmt(local.sellUsed.iqd22, "IQD") : "--"} | 21K:{" "}
            {local.sellUsed.iqd21 ? fmt(local.sellUsed.iqd21, "IQD") : "--"}
          </div>
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
      </div>

      <div style={{ marginTop: 12 }}>
        <label>العيار</label>
        <select value={karat} onChange={(e) => setKarat(e.target.value as Karat)}>
          <option value="24K">24K</option>
          <option value="22K">22K</option>
          <option value="21K">21K</option>
          <option value="18K">18K</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>سعر الدولار</label>
        <input
          type="number"
          value={dollarPrice}
          min={0}
          step={1}
          onChange={(e) => setDollarPrice(Number(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>الوزن (غرام)</label>
        <input
          type="number"
          value={weight}
          min={0}
          step={0.1}
          onChange={(e) => setWeight(Number(e.target.value))}
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
            onChange={(e) => setLaborUsd(Number(e.target.value))}
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
            onChange={(e) => setProfit(Number(e.target.value))}
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