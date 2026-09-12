"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/app/lib/i18n";
import { getGramHistory, type GramPrice } from "@/app/lib/gramPrices";
import LineChart from "@/app/components/LineChart";

type Range = 30 | 90 | 0;

export default function MarketPage() {
  const { lang, dir } = useT();
  const ar = lang === "ar";
  const [rows, setRows] = useState<GramPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    setLoading(true);
    getGramHistory(range).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [range]);

  const iqd = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");
  const dateFmt = (ms: number) =>
    new Date(ms).toLocaleDateString(ar ? "ar-EG" : "en-US", { day: "numeric", month: "short" });

  const series = (field: keyof GramPrice) =>
    rows
      .map((r) => ({ x: new Date(r.recorded_at).getTime(), y: Number(r[field]) || 0 }))
      .filter((p) => p.y > 0);

  const priceSeries = useMemo(() => series("sell_gram_iqd"), [rows]);
  const dollarSeries = useMemo(() => series("usd_to_iqd"), [rows]);
  const ounceSeries = useMemo(() => series("ounce_usd"), [rows]);

  const stat = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return null;
    const ys = pts.map((p) => p.y);
    const first = ys[0];
    const last = ys[ys.length - 1];
    const change = last - first;
    const pct = first ? (change / first) * 100 : 0;
    return { last, first, change, pct, high: Math.max(...ys), low: Math.min(...ys) };
  };
  const price = stat(priceSeries);
  const dollar = stat(dollarSeries);
  const ounce = stat(ounceSeries);

  const T = ar
    ? {
        title: "تحليل السوق",
        subtitle: "اتجاهات أسعار الذهب في العراق ومؤشرات السوق",
        r30: "٣٠ يوم",
        r90: "٩٠ يوم",
        rAll: "الكل",
        current: "سعر بيع الغرام (21)",
        change: "التغيّر خلال الفترة",
        high: "الأعلى",
        low: "الأدنى",
        priceChart: "منحنى سعر بيع غرام عيار 21 (د.ع)",
        dollarChart: "سعر الدولار (USD/IQD)",
        ounceChart: "الأونصة العالمية (USD)",
        insufficient: "لا توجد بيانات كافية بعد — تتراكم يومياً.",
        back: "الرئيسية",
        loading: "جارٍ التحميل…",
        disclaimer: "بيانات للأغراض الإعلامية فقط، وليست نصيحة مالية.",
      }
    : {
        title: "Market Analysis",
        subtitle: "Gold price trends in Iraq and market indicators",
        r30: "30 days",
        r90: "90 days",
        rAll: "All",
        current: "Sell price / gram (21K)",
        change: "Change over period",
        high: "High",
        low: "Low",
        priceChart: "21K sell gram price (IQD)",
        dollarChart: "USD/IQD rate",
        ounceChart: "Global ounce (USD)",
        insufficient: "Not enough data yet — it accumulates daily.",
        back: "Home",
        loading: "Loading…",
        disclaimer: "Data for informational purposes only, not financial advice.",
      };

  const RANGES: { key: Range; label: string }[] = [
    { key: 30, label: T.r30 },
    { key: 90, label: T.r90 },
    { key: 0, label: T.rAll },
  ];

  const changeColor = (v: number | undefined) =>
    v == null ? "var(--muted)" : v >= 0 ? "#43c66a" : "#e66";
  const sign = (v: number) => (v >= 0 ? "+" : "");

  return (
    <main className="container" dir={dir}>
      <div className="row-between">
        <h1 className="title">{T.title}</h1>
        <a href="/" className="btn-secondary">{T.back}</a>
      </div>
      <p className="lead muted" style={{ marginTop: -4 }}>{T.subtitle}</p>

      <div className="mk-ranges">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={range === r.key ? "mk-r on" : "mk-r"}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">{T.loading}</p>
      ) : (
        <>
          {/* مؤشرات */}
          <div className="mk-kpis">
            <div className="mk-kpi">
              <span className="mk-label">{T.current}</span>
              <b className="mk-gold">{price ? `${iqd(price.last)} د.ع` : "—"}</b>
            </div>
            <div className="mk-kpi">
              <span className="mk-label">{T.change}</span>
              <b style={{ color: changeColor(price?.pct) }}>
                {price ? `${sign(price.change)}${iqd(price.change)} (${sign(price.pct)}${price.pct.toFixed(1)}%)` : "—"}
              </b>
            </div>
            <div className="mk-kpi">
              <span className="mk-label">{T.high}</span>
              <b>{price ? `${iqd(price.high)} د.ع` : "—"}</b>
            </div>
            <div className="mk-kpi">
              <span className="mk-label">{T.low}</span>
              <b>{price ? `${iqd(price.low)} د.ع` : "—"}</b>
            </div>
          </div>

          {/* منحنى السعر الرئيسي */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>{T.priceChart}</div>
            <LineChart
              points={priceSeries}
              color="#f2d27b"
              height={240}
              yFmt={(n) => iqd(n)}
              xFmt={dateFmt}
              emptyText={T.insufficient}
            />
          </div>

          {/* الدولار + الأونصة */}
          <div className="mk-two">
            <div className="card">
              <div className="card-title" style={{ marginBottom: 8 }}>
                {T.dollarChart}
                {dollar && (
                  <span className="mk-mini" style={{ color: changeColor(dollar.pct) }}>
                    {" "}{iqd(dollar.last)} ({sign(dollar.pct)}{dollar.pct.toFixed(1)}%)
                  </span>
                )}
              </div>
              <LineChart points={dollarSeries} color="#7bc5f2" height={170} yFmt={(n) => iqd(n)} xFmt={dateFmt} emptyText={T.insufficient} />
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 8 }}>
                {T.ounceChart}
                {ounce && (
                  <span className="mk-mini" style={{ color: changeColor(ounce.pct) }}>
                    {" "}${ounce.last.toLocaleString("en-US", { maximumFractionDigits: 0 })} ({sign(ounce.pct)}{ounce.pct.toFixed(1)}%)
                  </span>
                )}
              </div>
              <LineChart points={ounceSeries} color="#c9f27b" height={170} yFmt={(n) => `$${Math.round(n)}`} xFmt={dateFmt} emptyText={T.insufficient} />
            </div>
          </div>

          <p className="muted small" style={{ marginTop: 16 }}>ℹ️ {T.disclaimer}</p>
        </>
      )}

      <style jsx>{`
        .mk-ranges {
          display: inline-flex;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin: 12px 0 16px;
        }
        .mk-r {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          cursor: pointer;
        }
        .mk-r.on {
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .mk-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .mk-kpi {
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mk-label {
          color: var(--muted);
          font-size: 13px;
        }
        .mk-kpi b {
          font-size: 19px;
        }
        .mk-gold {
          color: var(--gold2);
        }
        .mk-mini {
          font-size: 13px;
          font-weight: 700;
        }
        .mk-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        @media (max-width: 700px) {
          .mk-two {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
