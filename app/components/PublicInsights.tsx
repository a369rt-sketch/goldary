"use client";

import { useEffect, useRef, useState } from "react";
import { provinces } from "@/app/lib/provinces";

type ProvinceRank = { province: string; pct: number };

type Insights = {
  buyGram: number | null;
  sellGram: number | null;
  ounceUsd: number | null;
  priceSeries: number[];
  marketMovement: number | null;
  provinceRanking: ProvinceRank[];
  topKarat: string | null;
  lastUpdate: string | null;
  isLive: boolean;
};

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// وقت نسبي حيّ: "قبل X دقيقة/ساعة/يوم"
const relativeTime = (iso: string | null, now: number): string => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diffMin = Math.floor((now - t) / 60000);
  if (diffMin < 1) return "قبل لحظات";
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ساعة`;
  const diffDay = Math.floor(diffHr / 24);
  return `قبل ${diffDay} يوم`;
};

// تطبيع سلسلة أرقام إلى نقاط SVG داخل w×h مع حاشية pad
function toPoints(series: number[], w: number, h: number, pad: number): string {
  const n = series.length;
  if (n < 2) return "";
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min;
  return series
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = span === 0 ? h / 2 : h - pad - ((v - min) / span) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function PublicInsights() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState(false);
  const prevPrice = useRef<{ ounce: number | null } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/public/insights", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setData(json?.error ? null : (json as Insights));
      } catch (e) {
        console.error("Public insights fetch failed", e);
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // "آخر تحديث" النسبي يعيد الحساب كل دقيقة
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // وميض ذهبي خفيف عند تغيّر سعر الأونصة (بلا وميض عند أول تحميل)
  useEffect(() => {
    if (!data) return;
    const prev = prevPrice.current;
    if (prev && prev.ounce !== data.ounceUsd) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 600);
      prevPrice.current = { ounce: data.ounceUsd };
      return () => clearTimeout(id);
    }
    prevPrice.current = { ounce: data.ounceUsd };
  }, [data]);

  const hasSeries = !!data && Array.isArray(data.priceSeries) && data.priceSeries.length >= 2;
  const hasRanking = !!data && data.provinceRanking?.length > 0;

  const movement = data?.marketMovement;
  const hasMovement = movement != null && Number.isFinite(movement);
  const movePositive = hasMovement && (movement as number) >= 0;
  const moveColor = !hasMovement ? "muted" : movePositive ? "up" : "down";
  const moveText = !hasMovement
    ? "—"
    : `${movePositive ? "▲ +" : "▼ −"}${Math.abs(movement as number)}%`;

  return (
    <section className="pi" dir="rtl">
      <div className="pi-head">
        <div>
          <h2>إحصاءات السوق</h2>
          <p>مؤشرات الذهب الحية في العراق</p>
        </div>
        <span className={`pi-live ${data?.isLive ? "on" : "off"}`}>
          <i />
          {data?.isLive ? "مباشر" : "غير محدّث"}
        </span>
      </div>

      {loading ? (
        <p className="pi-muted">جارٍ التحميل…</p>
      ) : !data ? (
        <div className="pi-card">
          <p className="pi-muted" style={{ margin: 0 }}>لا توجد بيانات بعد</p>
        </div>
      ) : (
        <div className="pi-grid">
          {/* الأونصة العالمية XAU/USD */}
          <div className="pi-card">
            <div className="pi-title">الأونصة العالمية (XAU/USD)</div>
            {data.ounceUsd ? (
              <div className="pi-priceRow">
                <div>
                  <span className="pi-lbl">سعر الأونصة</span>
                  <b className={`pi-gold ${flash ? "flash" : ""}`}>
                    {fmtUsd(data.ounceUsd)}
                  </b>
                </div>
              </div>
            ) : (
              <p className="pi-muted">لا يوجد سعر بعد</p>
            )}
            <div className="pi-sub">آخر تحديث: {relativeTime(data.lastUpdate, now)}</div>
          </div>

          {/* اتجاه السوق */}
          <div className="pi-card">
            <div className="pi-title">اتجاه السوق</div>
            <div className={`pi-move ${moveColor}`}>{moveText}</div>
            <div className="pi-sub">مقارنة آخر 30 يوم</div>
          </div>

          {/* العيار الأكثر طلباً */}
          <div className="pi-card">
            <div className="pi-title">العيار الأكثر طلباً</div>
            <div className="pi-karat">{data.topKarat ?? "—"}</div>
            <div className="pi-sub">حسب حسابات الزوار</div>
          </div>

          {/* مخطط حركة السعر */}
          <div className="pi-card pi-chartCard">
            <div className="pi-title">حركة السعر</div>
            {hasSeries ? (
              <svg viewBox="0 0 600 160" className="pi-chart" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="piFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f6c54a" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f6c54a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  className="pi-fill"
                  points={`${toPoints(data.priceSeries, 600, 160, 14)} 600,160 0,160`}
                  fill="url(#piFill)"
                />
                <polyline
                  className="pi-drawline"
                  pathLength={1}
                  points={toPoints(data.priceSeries, 600, 160, 14)}
                  fill="none"
                  stroke="#ffd35a"
                  strokeWidth="2.5"
                />
              </svg>
            ) : (
              <p className="pi-muted pi-empty">لا توجد بيانات كافية لعرض المنحنى بعد</p>
            )}
          </div>

          {/* ترتيب المحافظات */}
          <div className="pi-card pi-rankCard">
            <div className="pi-title">ترتيب المحافظات</div>
            {hasRanking ? (
              <div className="pi-rankList">
                {data.provinceRanking.map((p, i) => (
                  <div className="pi-rankRow" key={p.province}>
                    <span className="pi-rankNo">{i + 1}</span>
                    <b className="pi-rankName">{provinceName(p.province)}</b>
                    <div className="pi-rankBar">
                      <i style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pi-muted">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .pi {
          margin-top: 40px;
        }
        .pi-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 18px;
        }
        .pi-head h2 {
          margin: 0;
          color: #ffe5a7;
          font-size: 26px;
        }
        .pi-head p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
        }
        .pi-live {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .pi-live i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .pi-live.on {
          color: #7ae28c;
        }
        .pi-live.on i {
          background: #58df73;
          box-shadow: 0 0 12px #58df73;
        }
        .pi-live.off {
          color: #ffcc4a;
        }
        .pi-live.off i {
          background: #ffcc4a;
        }
        .pi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .pi-card {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025));
          border-radius: 20px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
          padding: 20px;
        }
        .pi-chartCard {
          grid-column: span 2;
        }
        .pi-rankCard {
          grid-column: span 1;
        }
        .pi-title {
          color: rgba(255, 255, 255, 0.72);
          font-size: 15px;
          margin-bottom: 14px;
        }
        .pi-priceRow {
          display: flex;
          gap: 24px;
        }
        .pi-lbl {
          display: block;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          margin-bottom: 4px;
        }
        .pi-gold {
          color: #ffd35a;
          font-size: 22px;
        }
        .pi-sub {
          margin-top: 14px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 12px;
        }
        .pi-move {
          font-size: 34px;
          font-weight: 700;
        }
        .pi-move.up {
          color: #8dff9d;
        }
        .pi-move.down {
          color: #ff8f8f;
        }
        .pi-move.muted {
          color: rgba(255, 255, 255, 0.55);
        }
        .pi-karat {
          color: #ffd35a;
          font-size: 40px;
          font-weight: 700;
        }
        .pi-chart {
          width: 100%;
          height: 160px;
          margin-top: 6px;
        }
        .pi-empty {
          display: grid;
          place-items: center;
          height: 150px;
          margin: 0;
        }
        .pi-muted {
          color: rgba(255, 255, 255, 0.5);
        }
        .pi-rankList {
          display: grid;
          gap: 12px;
        }
        .pi-rankRow {
          display: grid;
          grid-template-columns: 22px 74px 1fr;
          gap: 10px;
          align-items: center;
          font-size: 14px;
        }
        .pi-rankNo {
          color: rgba(255, 255, 255, 0.5);
        }
        .pi-rankBar {
          height: 6px;
          background: rgba(255, 255, 255, 0.09);
          border-radius: 999px;
          overflow: hidden;
        }
        .pi-rankBar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fff0a9, #ffbf36);
        }
        @media (max-width: 900px) {
          .pi-grid {
            grid-template-columns: 1fr;
          }
          .pi-chartCard,
          .pi-rankCard {
            grid-column: span 1;
          }
        }

        /* ===== الحركات (طبقة بصرية خفيفة) ===== */
        @keyframes pi-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.14);
            opacity: 1;
          }
        }
        .pi-live.on i {
          animation: pi-pulse 2s ease-in-out infinite;
        }

        @keyframes pi-flash {
          0% {
            color: #fff6d8;
            text-shadow: 0 0 14px rgba(255, 211, 90, 0.85);
          }
          100% {
            color: #ffd35a;
            text-shadow: none;
          }
        }
        .pi-gold.flash {
          animation: pi-flash 0.6s ease-out;
        }

        @keyframes pi-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pi-card {
          animation: pi-enter 0.5s ease both;
        }
        .pi-card:nth-child(1) {
          animation-delay: 0.04s;
        }
        .pi-card:nth-child(2) {
          animation-delay: 0.09s;
        }
        .pi-card:nth-child(3) {
          animation-delay: 0.14s;
        }
        .pi-card:nth-child(4) {
          animation-delay: 0.19s;
        }
        .pi-card:nth-child(5) {
          animation-delay: 0.24s;
        }

        @keyframes pi-draw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .pi-drawline {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: pi-draw 1s ease forwards;
        }

        @keyframes pi-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .pi-fill {
          animation: pi-fade 1s ease forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .pi-live.on i,
          .pi-gold.flash,
          .pi-card,
          .pi-drawline,
          .pi-fill {
            animation: none !important;
          }
          .pi-card {
            opacity: 1;
            transform: none;
          }
          .pi-drawline {
            stroke-dasharray: none;
            stroke-dashoffset: 0;
          }
          .pi-fill {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
