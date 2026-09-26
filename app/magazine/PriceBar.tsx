"use client";

import { useEffect, useRef, useState } from "react";
import { getGramHistory } from "@/app/lib/gramPrices";
import { supabase } from "@/app/lib/supabaseClient";
import { useT } from "@/app/lib/i18n";

type Trend = "up" | "down" | "flat";

type Data = {
  gram: number | null;
  gramTrend: Trend;
  ounce: number | null;
  ounceTrend: Trend;
  dollar: number | null;
  dollarTrend: Trend;
  spark: number[]; // قيم آخر 24 ساعة لسعر الغرام (تصاعدي)
  updatedAt: Date | null;
};

const trendOf = (cur: number | null, prev: number | null): Trend => {
  if (cur == null || prev == null) return "flat";
  if (cur > prev) return "up";
  if (cur < prev) return "down";
  return "flat";
};

// اكتشاف تفضيل تقليل الحركة
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

// عدّاد تصاعدي من الصفر إلى القيمة (يحترم تقليل الحركة)
function useCountUp(target: number | null, reduced: boolean, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target == null) return;
    if (reduced) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, reduced, duration]);
  return target == null ? null : val;
}

// بناء مسار الـsparkline داخل viewBox 112×44
function buildSpark(vals: number[]) {
  if (vals.length < 2) return null;
  const W = 112, H = 44, padX = 2, padTop = 5, padBot = 8;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = vals.length;
  const pts = vals.map((v, i) => {
    const x = padX + (i / (n - 1)) * (W - padX * 2);
    const y = padTop + (1 - (v - min) / span) * (H - padTop - padBot);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`;
  // طول تقريبي للمسار لتحريك الرسم التدريجي
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return { line, area, len: Math.ceil(len), last: pts[n - 1] };
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

function Arrow({ trend, size = 16 }: { trend: Trend; size?: number }) {
  if (trend === "flat") return null;
  const up = trend === "up";
  return (
    <span
      className="mag-pulse"
      style={{ color: up ? "#D4AF5F" : "#E8A48A", fontSize: size }}
      aria-label={up ? "ارتفاع" : "انخفاض"}
    >
      {up ? "▲" : "▼"}
    </span>
  );
}

export default function PriceBar() {
  const { t } = useT();
  const reduced = usePrefersReducedMotion();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // 48 ساعة لضمان وجود قراءة سابقة، والـsparkline يأخذ آخر 24 ساعة منها
      const [hist, dollarRes] = await Promise.all([
        getGramHistory(2),
        supabase
          .from("dollar_rate")
          .select("usd_to_iqd, recorded_at")
          .order("recorded_at", { ascending: false })
          .limit(2),
      ]);

      if (!alive) return;

      const last = hist[hist.length - 1] ?? null;
      const prev = hist[hist.length - 2] ?? null;

      const gram = last ? Number(last.sell_gram_iqd) || null : null;
      const gramPrev = prev ? Number(prev.sell_gram_iqd) || null : null;
      const ounce = last?.ounce_usd != null ? Number(last.ounce_usd) || null : null;
      const ouncePrev = prev?.ounce_usd != null ? Number(prev.ounce_usd) || null : null;

      const drRows = (dollarRes.data ?? []) as { usd_to_iqd: number; recorded_at: string }[];
      const dollar = drRows[0]?.usd_to_iqd != null ? Number(drRows[0].usd_to_iqd) || null : null;
      const dollarPrev = drRows[1]?.usd_to_iqd != null ? Number(drRows[1].usd_to_iqd) || null : null;

      // نقاط آخر 24 ساعة (وإلا آخر ما يتوفّر)
      const since = Date.now() - 24 * 60 * 60 * 1000;
      let window = hist.filter((r) => new Date(r.recorded_at).getTime() >= since);
      if (window.length < 2) window = hist.slice(-8);
      const spark = window.map((r) => Number(r.sell_gram_iqd)).filter((v) => Number.isFinite(v));

      setData({
        gram,
        gramTrend: trendOf(gram, gramPrev),
        ounce,
        ounceTrend: trendOf(ounce, ouncePrev),
        dollar,
        dollarTrend: trendOf(dollar, dollarPrev),
        spark,
        updatedAt: last ? new Date(last.recorded_at) : null,
      });
    };

    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const gramCount = useCountUp(data?.gram ?? null, reduced);
  const ounceCount = useCountUp(data?.ounce ?? null, reduced);
  const dollarCount = useCountUp(data?.dollar ?? null, reduced);

  const spark = data ? buildSpark(data.spark) : null;
  const timeText = data?.updatedAt
    ? data.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <section
      aria-label={t.mag_price_today}
      style={{
        margin: "20px 20px 0",
        background: "#4E3C31",
        borderRadius: 18,
        padding: "18px 18px 16px",
        color: "#F4EEE3",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 14px 34px rgba(46,42,37,0.28)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#E6D9C6" }}>{t.mag_price_today}</span>
        <span style={{ fontSize: 12, color: "#D9CBB6" }}>
          {t.updated} {timeText}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, color: "#E6D9C6" }}>{t.pb_gram21}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="mag-shine-gold" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.2 }}>
              {gramCount == null ? "—" : fmtInt(gramCount)}
            </span>
            {data?.gram != null && <span style={{ fontSize: 13, color: "#E6D9C6" }}>{t.iqd_suffix}</span>}
            {data && <Arrow trend={data.gramTrend} />}
          </div>
        </div>

        {spark ? (
          <svg width="112" height="44" viewBox="0 0 112 44" aria-hidden="true" style={{ overflow: "visible" }}>
            <path d={spark.area} fill="rgba(212,175,95,0.14)" />
            <path
              className="mag-draw"
              d={spark.line}
              fill="none"
              stroke="#D4AF5F"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ "--dash": String(spark.len) } as React.CSSProperties}
            />
            <circle className="mag-dot" cx={spark.last[0]} cy={spark.last[1]} r="3" fill="#FFF1C4" />
          </svg>
        ) : (
          <svg width="112" height="44" viewBox="0 0 112 44" aria-hidden="true" />
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          borderTop: "1px solid rgba(244,238,227,0.18)",
          paddingTop: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 12, color: "#E6D9C6" }}>{t.pb_ounce}</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#F4EEE3" }}>
            {ounceCount == null ? "—" : `$${fmtInt(ounceCount)}`}{" "}
            {data && <Arrow trend={data.ounceTrend} size={12} />}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 12, color: "#E6D9C6" }}>{t.pb_dollar}</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#F4EEE3" }}>
            {dollarCount == null ? "—" : `${fmtInt(dollarCount)} ${t.iqd_suffix}`}{" "}
            {data && <Arrow trend={data.dollarTrend} size={12} />}
          </span>
        </div>
      </div>
    </section>
  );
}
