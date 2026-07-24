"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Coins,
  Calculator,
  MapPin,
  BarChart3,
  Gem,
  FileText,
  Settings,
  Users,
  Search,
  CalendarDays,
  ChevronDown,
  Crown,
  Diamond,
  PieChart,
  Activity,
  Store,
} from "lucide-react";




// يطبّع سلسلة أرقام إلى نقاط SVG داخل مستطيل w×h مع حاشية pad.
// x موزّعة بالتساوي، y مقلوبة ومطبّعة بين min/max (لو max==min → خط أوسط).
function toPoints(series: number[], w: number, h: number, pad: number): string {
  const n = series.length;
  if (n < 2) return "";
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min;
  return series
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y =
        span === 0
          ? h / 2
          : h - pad - ((v - min) / span) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Sparkline({ series }: { series?: number[] }) {
  const pts = Array.isArray(series) ? toPoints(series, 180, 40, 4) : "";
  return (
    <svg viewBox="0 0 180 40" className="sparkline">
      {pts ? (
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" />
      ) : (
        <line
          x1="0"
          y1="20"
          x2="180"
          y2="20"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      )}
    </svg>
  );
}
function StatCard({ icon, title, value, sub, change, series }: any) {
  const hasChange = change != null && Number.isFinite(change);
  const positive = hasChange && change >= 0;
  const changeColor = !hasChange
    ? "rgba(255,255,255,0.55)"
    : positive
    ? "#b7ffc5"
    : "#ff8f8f";
  const changeText = !hasChange
    ? "—"
    : `${positive ? "+" : "−"} ${Math.abs(change)}%`;

  return (
    <div className="card stat">
      <div className="statTop">
        <div className="iconCircle">{icon}</div>
        <div>
          <p>{title}</p>
          <h2>{value}</h2>
          <span>{sub}</span>
        </div>
      </div>
      <div className="line" />
      <div className="statBottom">
        <Sparkline series={series} />
        <div>
          <b style={{ color: changeColor }}>{changeText}</b>
          <small>vs last 30 days</small>
        </div>
      </div>
    </div>
  );
}
export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [showImportCosts, setShowImportCosts] = useState(false);

useEffect(() => {
  fetch("/api/admin/summary")
    .then((res) => res.json())
    .then((data) => setSummary(data));
}, []);

const months =
  summary?.monthlyActivity?.map((item: any) => [
    item.month,
    item.count,
  ]) || [];
  const maxMonthValue = Math.max(...months.map(([, v]: any) => v));

  const provinces =
  summary?.provinceRanking?.map((item: any) => [
    item.province,
    item.count,
    Math.round(
      (item.count /
        (summary?.provinceRanking?.[0]?.count || 1)) *
        100
    ),
  ]) || [];
  
  return (
    <>
      <main className="dashboard">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">G</div>
            <b>GOLDARY</b>
          </div>
          <nav>
            {[
              [Home, "Dashboard", true],
              [Coins, "Gold Prices"],
              [Calculator, "Calculations"],
              [Gem, "Provinces"],
              [BarChart3, "Karat Analytics"],
              [Diamond, "Market Insights"],
              [MapPin, "AI Predictions"],
              [FileText, "Reports"],
              [Settings, "Settings"],
              [Users, "Users"],
            ].map(([Icon, text, active]: any) => (
              <div className={`navItem ${active ? "active" : ""}`} key={text}>
                <Icon size={20} />
                <span>{text}</span>
              </div>
            ))}
            <Link
              href="/admin/shops"
              className="navItem"
              style={{ textDecoration: "none" }}
            >
              <Store size={20} />
              <span>المحلات (طلبات الموافقة)</span>
            </Link>
          </nav>
          <div className="system">
            <div>
              <h4>Live System</h4>
              {summary == null ? (
                <p style={{ color: "rgba(255,255,255,0.55)" }}>Checking…</p>
              ) : summary.isLive ? (
                <p>All systems active</p>
              ) : (
                <p style={{ color: "#ffcc4a" }}>
                  {summary.lastUpdate
                    ? `آخر تحديث: ${new Date(summary.lastUpdate).toLocaleString()}`
                    : "لا توجد تغذية أسعار بعد"}
                </p>
              )}
            </div>
            <i style={summary && !summary.isLive ? { background: "#ffcc4a" } : undefined} />
            <div className="rock" />
          </div>
        </aside>
        <section className="content">
          <header className="topbar">
            <div>
              <h1>Goldary Intelligence</h1>
              <p>Analytics Dashboard</p>
            </div>
            <div className="search">
              <Search size={18} />
              <input placeholder="Search anything..." />
            </div>
            <button>
            <div className="dateBtn">
  <CalendarDays size={18} />
  {new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}
  <ChevronDown size={16} />
</div>
            </button>
            <button className="live">
              <span />
              Live Data
            </button>
          </header>
          <section className="statsGrid">
          <StatCard icon={<Calculator size={30} />} title="Total Calculations" value={summary?.totalCalculations ?? 0} sub="All pricing events" change={summary?.totalChange ?? null} series={summary?.priceSeries} />
<StatCard icon={<Coins size={30} />} title="Avg Calculation Value" value={`${summary?.averagePrice?.toLocaleString() ?? 0} IQD`} sub="Average user calculation" change={summary?.avgChange ?? null} series={summary?.priceSeries} />
<StatCard icon={<Users size={30} />} title="Modified Users" value={summary?.modifiedUsers ?? 0} sub="Adjusted inputs" change={summary?.modifiedChange ?? null} series={summary?.priceSeries} />
<StatCard icon={<PieChart size={30} />} title="Customization Rate" value={`${Math.round(
  ((summary?.modifiedUsers || 0) /
    (summary?.totalCalculations || 1)) *
    100
)}%`}
 sub="Users who modified inputs" change={summary?.customizationChange ?? null} series={summary?.priceSeries} />
          </section>
          <section className="grid">
            <div className="card trends">
              <div className="head">
                <div>
                  <h3>Calculation Trends</h3>
                  <p>Monthly Activity Overview</p>
                </div>
                <button>2025⌄</button>
              </div>
              <div className="bars">
                {months.map(([m, v]: any) => (
                  <div className="barWrap" key={m}>
                    <div className="bar" style={{ height: `${(v / maxMonthValue) * 100}%` }} />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card ranking">
              <h3>Province Ranking</h3>
              <p>Regional Activity</p>
              <div className="rankList">
              {provinces.map(([name, value, percent]: any, index: number) => ( 
                                 <div className="rankRow" key={name}>
                    <span>{index + 1}</span>
                    <b>{name}</b>
                    <div className="rankBar">
                      <i style={{ width: `${percent}%` }} />
                    </div>
                    <strong>{value}</strong>
                    <em>{percent}%</em>
                  </div>
                ))}
              </div>
              <a>View all provinces ›</a>
            </div>
            <div className="card topKarat">
              <h3>Top Karat</h3>
              <p>Most Selected</p>
              <div className="karatFlex">
              <h2>{summary?.topKarat ?? "N/A"}</h2>
                <div className="ring" />
              </div>
              <p>Most preferred gold karat</p>
            </div>
            <div className="card market">
              <div className="head">
                <div>
                  <h3>Market Movement</h3>
                  <p>Price Trend Analysis</p>
                </div>
                {(() => {
                  const m = summary?.marketMovement;
                  const has = m != null && Number.isFinite(m);
                  const pos = has && m >= 0;
                  const color = !has
                    ? "rgba(255,255,255,0.7)"
                    : pos
                    ? "#8dff9d"
                    : "#ff8f8f";
                  const text = !has ? "—" : `${pos ? "+" : "−"}${Math.abs(m)}%`;
                  return <button style={{ color }}>{text}</button>;
                })()}
              </div>
              {Array.isArray(summary?.priceSeries) &&
              summary.priceSeries.length >= 2 ? (
                <svg viewBox="0 0 680 240" className="chart">
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f6c54a" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f6c54a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`${toPoints(summary.priceSeries, 680, 240, 20)} 680,240 0,240`}
                    fill="url(#goldFill)"
                  />
                  <polyline
                    points={toPoints(summary.priceSeries, 680, 240, 20)}
                    fill="none"
                    stroke="#ffd35a"
                    strokeWidth="3"
                  />
                </svg>
              ) : (
                <div
                  style={{
                    height: 275,
                    marginTop: 20,
                    display: "grid",
                    placeItems: "center",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  لا توجد بيانات كافية لعرض المنحنى
                </div>
              )}
            </div>
            <div className="card notes">
              <h3>Intelligence Notes</h3>
              <p>Quick Insights</p>
              {[
             [Crown, "Market Leader", summary?.topProvince ?? "N/A"],
             [Diamond, "Karat Preference", summary?.topKarat ?? "N/A"],
             [
               PieChart,
               "Customization Rate",
               `${Math.round(
                 ((summary?.modifiedUsers || 0) /
                   (summary?.totalCalculations || 1)) *
                   100
               )}%`,
             ],
             [
               Activity,
               "Top Province Calcs",
               summary?.provinceRanking?.[0]?.count ?? 0,
             ],
              ].map(([Icon, label, value]: any) => (
                <div className="note" key={label}>
                  <div>
                    <Icon size={20} />
                  </div>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="card province">
              <h3>Top Province</h3>
              <p>Most Active Location</p>
              <h2>{summary?.topProvince ?? "N/A"}</h2>
              <div className="mapShape">◇</div>
              <button>
                <MapPin size={16} />
                View on map
              </button>
            
            {summary?.recentCalculations?.map((item: any, index: number) => (
  <div className="event" key={index}>
    <span className="dot green" />
    <div>
      <b>
        {item.operation_type || "calculation"} from {item.province || "Unknown"}
      </b>
      <p>
        {item.karat} • {Number(item.calculated_price || 0).toLocaleString()} IQD
      </p>
    </div>
  </div>
))}
            </div>
          </section>
        </section>
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #050607;
          color: white;
          overflow-x: hidden;
        }
        .dashboard {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at 88% 20%, rgba(255, 196, 54, 0.12), transparent 24%),
            radial-gradient(circle at 88% 85%, rgba(255, 196, 54, 0.12), transparent 22%),
            linear-gradient(135deg, #040506, #0a0b0d 50%, #050506);
          font-family: Inter, Arial, sans-serif;
        }
        .sidebar {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          padding: 24px 18px;
          position: sticky;
          top: 0;
          background: rgba(9, 10, 12, 0.82);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 35px;
          color: #ffe4a1;
          letter-spacing: 1px;
        }
        .logo {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ffe17b, #9b6814);
          color: #090909;
          font-size: 34px;
          font-weight: 900;
          box-shadow: 0 0 34px rgba(255, 198, 62, 0.35);
        }
        .navItem {
          height: 54px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 0 18px;
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 8px;
        }
        .navItem.active {
          color: #fff2c2;
          border: 1px solid rgba(255, 199, 57, 0.55);
          background: linear-gradient(90deg, rgba(255, 196, 54, 0.34), rgba(255, 196, 54, 0.06));
          box-shadow: inset 0 0 22px rgba(255, 204, 70, 0.18), 0 0 28px rgba(255, 196, 54, 0.18);
        }
        .system {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 22px;
          height: 210px;
          padding: 18px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
        }
        .system h4 {
          margin: 0 0 8px;
        }
        .system p {
          margin: 0;
          color: #7ae28c;
          font-size: 14px;
        }
        .system > i {
          position: absolute;
          top: 24px;
          right: 20px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #58df73;
        }
        .rock {
          position: absolute;
          bottom: -35px;
          left: 25px;
          width: 170px;
          height: 125px;
          background: radial-gradient(circle at 45% 35%, #ffe18a, #7a4f0e 50%, transparent 72%);
          opacity: 0.78;
          transform: rotate(-10deg);
        }
        .content {
          flex: 1;
          padding: 34px 38px;
          min-width: 0;
        }
        .topbar {
          display: grid;
          grid-template-columns: 1.2fr 1.4fr auto auto;
          gap: 26px;
          align-items: center;
          margin-bottom: 28px;
        }
        .topbar h1 {
          margin: 0;
          color: #ffe5a7;
          font-size: 34px;
        }
        .topbar p {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.62);
          font-size: 18px;
        }
        .search,
        .topbar button {
          height: 58px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.045);
          color: rgba(255,255,255,0.82);
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 18px;
        }
        .search input {
          background: transparent;
          border: 0;
          outline: 0;
          color: white;
          width: 100%;
          font-size: 15px;
        }
        .live span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffc83e;
          box-shadow: 0 0 18px #ffc83e;
        }
        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 20px;
        }
        .card {
          border: 1px solid rgba(255,255,255,0.14);
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025));
          border-radius: 22px;
          box-shadow: 0 18px 60px rgba(0,0,0,0.35);
          padding: 22px;
        }
        .statTop {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .iconCircle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #ffe99f;
          background: radial-gradient(circle at 35% 30%, #ffe791, #9e6a14 55%, #2b1b06);
          box-shadow: 0 0 34px rgba(255, 196, 54, 0.28);
        }
        .stat p {
          margin: 0 0 8px;
          color: rgba(255,255,255,0.78);
        }
        .stat h2 {
          margin: 0;
          font-size: 34px;
        }
        .stat span,
        .card p {
          color: rgba(255,255,255,0.55);
        }
        .line {
          height: 1px;
          margin: 22px 0 12px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
        }
        .statBottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sparkline {
          width: 180px;
          color: #ffd057;
          filter: drop-shadow(0 0 6px rgba(255, 205, 75, 0.7));
        }
        .statBottom b {
          color: #b7ffc5;
          display: block;
        }
        .statBottom small {
          color: rgba(255,255,255,0.48);
          font-size: 12px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr 0.52fr;
          gap: 18px;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .card h3 {
          margin: 0;
          font-size: 22px;
        }
        .card p {
          margin: 8px 0 0;
        }
        .card button {
          border: 1px solid rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.86);
          border-radius: 12px;
          padding: 12px 16px;
        }
        .trends,
        .ranking,
        .market,
        .notes {
          height: 390px;
        }
        .bars {
          height: 280px;
          margin-top: 25px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          background: linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 100% 55px;
        }
        .barWrap {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }
        .bar {
          width: 22px;
          border-radius: 6px 6px 2px 2px;
          background: linear-gradient(180deg, #ffe27b, #ac741c 70%, #3a2507);
          box-shadow: 0 0 20px rgba(255, 200, 66, 0.45);
        }
        .barWrap span {
          margin-top: 14px;
          color: rgba(255,255,255,0.58);
        }
        .rankList {
          margin-top: 20px;
        }
        .rankRow {
          display: grid;
          grid-template-columns: 24px 90px 1fr 36px 42px;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .rankBar {
          height: 5px;
          background: rgba(255,255,255,0.09);
          border-radius: 50px;
          overflow: hidden;
        }
        .rankBar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fff0a9, #ffbf36);
        }
        .rankRow em {
          color: rgba(255,255,255,0.55);
          font-style: normal;
        }
        .ranking a,
        .timeline a {
          color: #ffd35a;
          text-decoration: none;
          margin-top: 10px;
          display: inline-block;
        }
        .topKarat,
        .province {
          height: 245px;
        }
        .karatFlex {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .karatFlex h2,
        .province h2 {
          color: #ffd35a;
          font-size: 48px;
          margin: 24px 0;
        }
        .ring {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 14px solid #d59622;
          transform: rotate(-28deg) skew(-10deg);
          box-shadow: inset 0 0 15px #fff0a5, 0 0 25px rgba(255,190,50,.4);
        }
        .chart {
          width: 100%;
          height: 275px;
          margin-top: 20px;
          background: linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 100% 55px;
        }
        .green {
          color: #8dff9d !important;
        }
        .note {
          display: grid;
          grid-template-columns: 42px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .note div {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255, 203, 60, 0.14);
          color: #ffd45b;
        }
        .note b {
          color: #ffd45b;
        }
        .province {
          position: relative;
          overflow: hidden;
        }
        .province h2 {
          font-size: 34px;
          margin-top: 26px;
        }
        .mapShape {
          position: absolute;
          right: 24px;
          top: 70px;
          font-size: 108px;
          color: #ffd35a;
          opacity: 0.75;
          text-shadow: 0 0 35px rgba(255,200,60,.8);
        }
        .province button {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timeline {
          height: 300px;
        }
        .timeRow {
          display: grid;
          grid-template-columns: 16px 1fr auto;
          gap: 10px;
          align-items: center;
          margin-top: 18px;
          font-size: 13px;
        }
        .timeRow i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .timeRow .green {
          background: #2ce871;
          box-shadow: 0 0 12px #2ce871;
        }
        .timeRow .orange {
          background: #ff9e2c;
          box-shadow: 0 0 12px #ff9e2c;
        }
        .timeRow b {
          font-weight: 500;
          color: rgba(255,255,255,0.86);
        }
        .timeRow em {
          color: rgba(255,255,255,0.42);
          font-style: normal;
        }
        @media (max-width: 1200px) {
          .sidebar {
            display: none;
          }
          .content {
            padding: 24px;
          }
          .topbar,
          .statsGrid,
          .grid {
            grid-template-columns: 1fr;
          }
          .trends,
          .ranking,
          .market,
          .notes,
          .timeline {
            height: auto;
          }
        }
      `}</style>
    </>
  );
}

