"use client";

import { useEffect, useState } from "react";
import { provinces } from "@/app/lib/provinces";

type ProvinceRank = { province: string; pct: number };

type Insights = {
  buyGram: number | null;
  sellGram: number | null;
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

const fmtIqd = (n: number) => `${Math.round(n).toLocaleString("en-US")} د.ع`;

const formatUpdated = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("ar", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

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
          {/* سعر الغرام الحي */}
          <div className="pi-card">
            <div className="pi-title">سعر غرام 21K الحي</div>
            {data.sellGram || data.buyGram ? (
              <div className="pi-priceRow">
                <div>
                  <span className="pi-lbl">بيع</span>
                  <b className="pi-gold">{data.sellGram ? fmtIqd(data.sellGram) : "—"}</b>
                </div>
                <div>
                  <span className="pi-lbl">شراء</span>
                  <b className="pi-gold">{data.buyGram ? fmtIqd(data.buyGram) : "—"}</b>
                </div>
              </div>
            ) : (
              <p className="pi-muted">لا يوجد سعر بعد</p>
            )}
            <div className="pi-sub">آخر تحديث: {formatUpdated(data.lastUpdate)}</div>
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
                  points={`${toPoints(data.priceSeries, 600, 160, 14)} 600,160 0,160`}
                  fill="url(#piFill)"
                />
                <polyline
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
      `}</style>
    </section>
  );
}
