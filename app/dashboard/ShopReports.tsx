"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyInvoices, type Invoice, type InvoiceType } from "@/app/lib/invoices";
import { getStaff, type Staff } from "@/app/lib/staff";

const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("en-US")} د.ع`;
const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("ar-EG", { month: "short", year: "numeric" });
};

type Period = "month" | "year" | "all";
const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "هذا الشهر" },
  { key: "year", label: "هذه السنة" },
  { key: "all", label: "الكل" },
];

export default function ShopReports({ shopUserId }: { shopUserId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    Promise.all([getMyInvoices(shopUserId), getStaff(shopUserId)]).then(([inv, stf]) => {
      setInvoices(inv);
      setStaff(stf);
      setLoading(false);
    });
  }, [shopUserId]);

  // الفواتير الفعّالة (غير الملغاة)
  const active = useMemo(() => invoices.filter((i) => i.status !== "void"), [invoices]);

  const inPeriod = useMemo(() => {
    if (period === "all") return active;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const y = String(now.getFullYear());
    return active.filter((i) =>
      period === "month" ? monthKey(i.created_at) === ym : i.created_at.slice(0, 4) === y
    );
  }, [active, period]);

  const sumBy = (list: Invoice[], t: InvoiceType) =>
    list.filter((i) => i.type === t).reduce((s, i) => s + (Number(i.total) || 0), 0);

  const sales = sumBy(inPeriod, "sale");
  const purchases = sumBy(inPeriod, "purchase");
  const repairs = sumBy(inPeriod, "repair");
  const net = sales + repairs - purchases;

  const countBy = (t: InvoiceType) => inPeriod.filter((i) => i.type === t).length;

  // المبيعات حسب الموظف (فواتير البيع في الفترة)
  const perStaff = useMemo(() => {
    const nameOf = (id: string | null) =>
      id ? staff.find((s) => s.id === id)?.name ?? "موظف محذوف" : "غير محدد";
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const i of inPeriod) {
      if (i.type !== "sale") continue;
      const key = i.staff_id ?? "none";
      const cur = map.get(key) ?? { name: nameOf(i.staff_id), total: 0, count: 0 };
      cur.total += Number(i.total) || 0;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [inPeriod, staff]);

  // مخطط شهري لآخر 6 أشهر (مبيعات) — مستقل عن الفلتر
  const monthly = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const map: Record<string, number> = {};
    for (const k of keys) map[k] = 0;
    for (const i of active) {
      if (i.type !== "sale") continue;
      const k = monthKey(i.created_at);
      if (k in map) map[k] += Number(i.total) || 0;
    }
    const max = Math.max(1, ...keys.map((k) => map[k]));
    return keys.map((k) => ({ key: k, value: map[k], pct: Math.round((map[k] / max) * 100) }));
  }, [active]);

  if (loading) {
    return (
      <section className="si card">
        <div className="card-title">التقارير والمبيعات</div>
        <p className="muted">جارٍ التحميل…</p>
      </section>
    );
  }

  return (
    <section className="si card">
      <div className="rp-head">
        <div className="card-title">التقارير والمبيعات</div>
        <div className="rp-periods">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={period === p.key ? "rp-p on" : "rp-p"}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {active.length === 0 ? (
        <p className="muted">لا توجد فواتير بعد — أنشئ فاتورة لتظهر التقارير.</p>
      ) : (
        <>
          {/* مؤشرات */}
          <div className="rp-kpis">
            <div className="rp-kpi">
              <span className="rp-k-label">المبيعات</span>
              <b className="rp-gold">{fmt(sales)}</b>
              <span className="rp-k-sub">{countBy("sale")} فاتورة</span>
            </div>
            <div className="rp-kpi">
              <span className="rp-k-label">المشتريات</span>
              <b>{fmt(purchases)}</b>
              <span className="rp-k-sub">{countBy("purchase")} فاتورة</span>
            </div>
            <div className="rp-kpi">
              <span className="rp-k-label">التصليح</span>
              <b>{fmt(repairs)}</b>
              <span className="rp-k-sub">{countBy("repair")} فاتورة</span>
            </div>
            <div className="rp-kpi rp-net">
              <span className="rp-k-label">صافي التدفق</span>
              <b className={net >= 0 ? "rp-pos" : "rp-neg"}>{fmt(net)}</b>
              <span className="rp-k-sub">بيع + تصليح − شراء</span>
            </div>
          </div>

          {/* مخطط شهري للمبيعات */}
          <div className="rp-chart">
            <div className="rp-chart-title">مبيعات آخر 6 أشهر</div>
            <div className="rp-bars">
              {monthly.map((m) => (
                <div className="rp-bar-col" key={m.key} title={fmt(m.value)}>
                  <div className="rp-bar-wrap">
                    <div className="rp-bar" style={{ height: `${Math.max(2, m.pct)}%` }} />
                  </div>
                  <span className="rp-bar-label">{monthLabel(m.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* المبيعات حسب الموظف */}
          {perStaff.length > 0 && (
            <div className="rp-staff">
              <div className="rp-chart-title">المبيعات حسب الموظف</div>
              <div className="rp-staff-list">
                {perStaff.map((s) => (
                  <div className="rp-staff-row" key={s.name}>
                    <span>{s.name}</span>
                    <span className="muted">{s.count} فاتورة</span>
                    <b className="rp-gold">{fmt(s.total)}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .rp-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .rp-periods {
          display: inline-flex;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
        }
        .rp-p {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .rp-p.on {
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .rp-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        .rp-kpi {
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rp-net {
          border-color: rgba(60, 180, 90, 0.35);
        }
        .rp-k-label {
          color: var(--muted);
          font-size: 13px;
        }
        .rp-kpi b {
          font-size: 20px;
        }
        .rp-gold {
          color: var(--gold2);
        }
        .rp-pos {
          color: #43c66a;
        }
        .rp-neg {
          color: #e66;
        }
        .rp-k-sub {
          color: var(--muted);
          font-size: 11px;
        }
        .rp-chart {
          margin-top: 18px;
          border-top: 1px solid var(--stroke);
          padding-top: 14px;
        }
        .rp-chart-title {
          color: var(--gold2);
          font-weight: 700;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .rp-bars {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          align-items: end;
          height: 140px;
        }
        .rp-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
        }
        .rp-bar-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }
        .rp-bar {
          width: 100%;
          border-radius: 6px 6px 0 0;
          background: linear-gradient(180deg, #f2d27b, #d7b45a);
          min-height: 2px;
        }
        .rp-bar-label {
          color: var(--muted);
          font-size: 10px;
          white-space: nowrap;
        }
        .rp-staff {
          margin-top: 18px;
          border-top: 1px solid var(--stroke);
          padding-top: 14px;
        }
        .rp-staff-list {
          display: grid;
          gap: 8px;
        }
        .rp-staff-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(215, 180, 90, 0.14);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 14px;
        }
      `}</style>
    </section>
  );
}
