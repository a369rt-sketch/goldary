"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyItems, ITEM_KARATS, type ShopItem } from "@/app/lib/shopItems";
import { getStockMovements, type StockMovement } from "@/app/lib/invoices";
import { getLatestGramPrice } from "@/app/lib/gramPrices";

const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("en-US")} د.ع`;
const wfmt = (n: number) => `${(Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} غ`;
const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
const karatNum = (k: string | null) => Number(String(k ?? "").replace(/\D/g, "")) || 0;

export default function ShopStock({ shopUserId }: { shopUserId: string }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [moves, setMoves] = useState<StockMovement[]>([]);
  const [sell21, setSell21] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyItems(shopUserId), getStockMovements(shopUserId), getLatestGramPrice()]).then(
      ([its, mv, gram]) => {
        setItems(its);
        setMoves(mv);
        setSell21(gram ? Number(gram.sell_gram_iqd) : null);
        setLoading(false);
      }
    );
  }, [shopUserId]);

  const inStock = useMemo(() => items.filter((i) => i.status !== "sold"), [items]);

  // الوزن لكل عيار + القيمة التقديرية (وزن × سعر بيع الغرام لذلك العيار)
  const { totalWeight, byKarat, estValue } = useMemo(() => {
    const wk: Record<string, number> = {};
    let tw = 0;
    let val = 0;
    for (const it of inStock) {
      const w = Number(it.weight) || 0;
      if (w <= 0 || !it.karat) continue;
      tw += w;
      wk[it.karat] = (wk[it.karat] || 0) + w;
      if (sell21 != null && karatNum(it.karat) > 0) {
        val += w * sell21 * (karatNum(it.karat) / 21);
      }
    }
    return { totalWeight: tw, byKarat: wk, estValue: sell21 != null ? val : null };
  }, [inStock, sell21]);

  if (loading) {
    return (
      <section className="si card">
        <div className="card-title">تتبّع المخزون</div>
        <p className="muted">جارٍ التحميل…</p>
      </section>
    );
  }

  return (
    <section className="si card">
      <div className="card-title" style={{ marginBottom: 14 }}>تتبّع المخزون</div>

      {/* ملخّص المخزون الحالي */}
      <div className="st-kpis">
        <div className="st-kpi">
          <span className="st-label">القطع بالمخزون</span>
          <b className="st-gold">{inStock.length}</b>
        </div>
        <div className="st-kpi">
          <span className="st-label">إجمالي الوزن</span>
          <b>{wfmt(totalWeight)}</b>
        </div>
        <div className="st-kpi">
          <span className="st-label">القيمة التقديرية</span>
          <b className="st-gold">{estValue != null ? fmt(estValue) : "—"}</b>
          <span className="st-sub">بسعر البيع الحالي</span>
        </div>
      </div>

      {/* الوزن حسب العيار */}
      {totalWeight > 0 && (
        <div className="st-karats">
          {ITEM_KARATS.filter((k) => byKarat[k]).map((k) => (
            <span className="st-krow" key={k}>
              <span className="muted">{k}</span> <b>{wfmt(byKarat[k])}</b>
            </span>
          ))}
        </div>
      )}

      {/* حركات المخزون (من الفواتير) */}
      <div className="st-moves">
        <div className="st-moves-title">آخر الحركات (من الفواتير)</div>
        {moves.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            لا توجد حركات بعد — تنشأ من فواتير البيع (خروج) والشراء (دخول).
          </p>
        ) : (
          <div className="st-list">
            {moves.slice(0, 20).map((m) => (
              <div className="st-move" key={m.id}>
                <span className={m.direction === "in" ? "st-dir in" : "st-dir out"}>
                  {m.direction === "in" ? "↓ دخول" : "↑ خروج"}
                </span>
                <span className="st-desc">{m.description || "—"}</span>
                <span className="muted st-wk">
                  {m.weight != null ? wfmt(m.weight) : ""} {m.karat ?? ""}
                  {m.quantity > 1 ? ` ×${m.quantity}` : ""}
                </span>
                <span className="muted st-meta">
                  #{m.invoiceNumber} · {dateFmt(m.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .st-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        .st-kpi {
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .st-label {
          color: var(--muted);
          font-size: 13px;
        }
        .st-kpi b {
          font-size: 20px;
        }
        .st-gold {
          color: var(--gold2);
        }
        .st-sub {
          color: var(--muted);
          font-size: 11px;
        }
        .st-karats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .st-krow {
          background: rgba(215, 180, 90, 0.1);
          border: 1px solid rgba(215, 180, 90, 0.25);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 13px;
        }
        .st-moves {
          margin-top: 18px;
          border-top: 1px solid var(--stroke);
          padding-top: 14px;
        }
        .st-moves-title {
          color: var(--gold2);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .st-list {
          display: grid;
          gap: 8px;
        }
        .st-move {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(215, 180, 90, 0.14);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
        }
        .st-dir {
          font-weight: 800;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .st-dir.in {
          color: #43c66a;
          background: rgba(60, 180, 90, 0.15);
        }
        .st-dir.out {
          color: #e6a866;
          background: rgba(215, 150, 90, 0.15);
        }
        .st-desc {
          flex: 1;
          min-width: 100px;
          color: var(--text);
        }
        .st-wk {
          font-size: 12px;
        }
        .st-meta {
          font-size: 12px;
          white-space: nowrap;
        }
      `}</style>
    </section>
  );
}
