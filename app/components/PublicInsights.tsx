"use client";

import { useEffect, useState } from "react";
import { provinces } from "@/app/lib/provinces";

type ProvinceRank = { province: string; count: number };
type MonthActivity = { month: string; count: number };

type Insights = {
  topProvince: string;
  topKarat: string;
  averagePrice: number;
  provinceRanking: ProvinceRank[];
  monthlyActivity: MonthActivity[];
};

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

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

  if (loading) {
    return (
      <section dir="rtl" style={{ marginTop: 40 }}>
        <h2 className="h2">إحصاءات السوق</h2>
        <p className="muted">جارٍ التحميل…</p>
      </section>
    );
  }

  const hasData = !!data && data.provinceRanking?.length > 0;

  if (!hasData) {
    return (
      <section dir="rtl" style={{ marginTop: 40 }}>
        <h2 className="h2">إحصاءات السوق</h2>
        <p className="muted">لا توجد بيانات بعد</p>
      </section>
    );
  }

  const maxMonth = Math.max(1, ...data.monthlyActivity.map((m) => m.count));
  const maxRank = Math.max(1, ...data.provinceRanking.map((p) => p.count));
  const topRanking = data.provinceRanking.slice(0, 6);

  return (
    <section dir="rtl" style={{ marginTop: 40 }}>
      <h2 className="h2">إحصاءات السوق</h2>

      <div className="grid">
        {/* متوسط السعر */}
        <div className="card">
          <div className="card-title">متوسط السعر المحسوب</div>
          <div className="price" style={{ color: "var(--gold2)", marginTop: 8 }}>
            {data.averagePrice.toLocaleString()}
          </div>
        </div>

        {/* أعلى عيار */}
        <div className="card">
          <div className="card-title">أعلى عيار مطلوب</div>
          <div className="price" style={{ color: "var(--gold2)", marginTop: 8 }}>
            {data.topKarat}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            الأكثر طلباً في {provinceName(data.topProvince)}
          </div>
        </div>

        {/* النشاط الشهري */}
        <div className="card">
          <div className="card-title">النشاط الشهري</div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 120,
              marginTop: 12,
            }}
          >
            {data.monthlyActivity.map((m) => (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  title={`${m.count}`}
                  style={{
                    width: "100%",
                    height: `${(m.count / maxMonth) * 90}%`,
                    minHeight: m.count > 0 ? 4 : 0,
                    background: "linear-gradient(180deg, var(--gold2), var(--gold))",
                    borderRadius: "6px 6px 2px 2px",
                  }}
                />
                <span className="tiny muted">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ترتيب المحافظات */}
        <div className="card">
          <div className="card-title">ترتيب المحافظات</div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {topRanking.map((p, i) => (
              <div
                key={p.province}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span className="muted small">{i + 1}</span>
                <div>
                  <div className="small" style={{ marginBottom: 4 }}>
                    {provinceName(p.province)}
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "var(--panel2)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(p.count / maxRank) * 100}%`,
                        background:
                          "linear-gradient(90deg, var(--gold2), var(--gold))",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
                <span className="small mono">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
