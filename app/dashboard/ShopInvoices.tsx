"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMyInvoices,
  getInvoiceItems,
  createInvoice,
  voidInvoice,
  lineTotal,
  INVOICE_TYPES,
  INVOICE_TYPE_LABEL,
  type Invoice,
  type InvoiceItem,
  type InvoiceType,
} from "@/app/lib/invoices";
import { getMyItems, ITEM_KARATS, type ShopItem } from "@/app/lib/shopItems";

type ShopHeader = {
  name: string | null;
  phone: string | null;
  province: string | null;
  logo_url: string | null;
};

const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("en-US")} د.ع`;
const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

// صفّ بند في النموذج (قيم نصية للإدخال)
type Row = {
  key: string;
  shop_item_id: string | null;
  description: string;
  weight: string;
  karat: string;
  price_per_gram: string;
  making_fee: string;
  quantity: string;
};

let rowSeq = 0;
const emptyRow = (): Row => ({
  key: `r${rowSeq++}`,
  shop_item_id: null,
  description: "",
  weight: "",
  karat: "21K",
  price_per_gram: "",
  making_fee: "",
  quantity: "1",
});

export default function ShopInvoices({
  shopUserId,
  shop,
}: {
  shopUserId: string;
  shop: ShopHeader;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  // نموذج
  const [type, setType] = useState<InvoiceType>("sale");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  // الإيصال (طباعة)
  const [receipt, setReceipt] = useState<{ inv: Invoice; items: InvoiceItem[] } | null>(null);

  const load = useCallback(async () => {
    const [inv, its] = await Promise.all([getMyInvoices(shopUserId), getMyItems(shopUserId)]);
    setInvoices(inv);
    setItems(its);
    setLoading(false);
  }, [shopUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const availableItems = items.filter((i) => i.status !== "sold");

  function resetForm() {
    setType("sale");
    setCustName("");
    setCustPhone("");
    setDiscount("");
    setNotes("");
    setRows([emptyRow()]);
  }

  function setRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // اختيار قطعة من المخزون يملأ الوصف/الوزن/العيار
  function pickInventory(key: string, itemId: string) {
    if (!itemId) {
      setRow(key, { shop_item_id: null });
      return;
    }
    const it = items.find((i) => i.id === itemId);
    if (!it) return;
    setRow(key, {
      shop_item_id: it.id,
      description: it.name,
      weight: it.weight != null ? String(it.weight) : "",
      karat: it.karat ?? "21K",
    });
  }

  const rowTotal = (r: Row) =>
    lineTotal({
      weight: r.weight ? Number(r.weight) : null,
      price_per_gram: r.price_per_gram ? Number(r.price_per_gram) : null,
      making_fee: r.making_fee ? Number(r.making_fee) : 0,
      quantity: r.quantity ? Number(r.quantity) : 1,
    });

  const subtotal = rows.reduce((s, r) => s + rowTotal(r), 0);
  const total = Math.max(0, subtotal - (discount ? Number(discount) : 0));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = rows.filter((r) => r.description.trim() || r.shop_item_id || rowTotal(r) > 0);
    if (valid.length === 0) {
      alert("أضِف بنداً واحداً على الأقل");
      return;
    }
    setBusy(true);
    const { error } = await createInvoice(shopUserId, {
      type,
      customer_name: custName.trim() || null,
      customer_phone: custPhone.trim() || null,
      discount: discount ? Number(discount) : 0,
      notes: notes.trim() || null,
      items: valid.map((r) => ({
        shop_item_id: r.shop_item_id,
        description: r.description.trim(),
        weight: r.weight ? Number(r.weight) : null,
        karat: r.karat || null,
        price_per_gram: r.price_per_gram ? Number(r.price_per_gram) : null,
        making_fee: r.making_fee ? Number(r.making_fee) : 0,
        quantity: r.quantity ? Number(r.quantity) : 1,
        line_total: rowTotal(r),
      })),
    });
    setBusy(false);
    if (error) {
      alert(`تعذّر حفظ الفاتورة: ${error}`);
      return;
    }
    resetForm();
    setShowForm(false);
    await load();
  }

  async function doVoid(inv: Invoice) {
    if (!confirm(`إلغاء الفاتورة رقم ${inv.number}؟`)) return;
    setBusy(true);
    await voidInvoice(inv.id);
    await load();
    setBusy(false);
  }

  async function openReceipt(inv: Invoice) {
    const its = await getInvoiceItems(inv.id);
    setReceipt({ inv, items: its });
    setTimeout(() => window.print(), 120);
  }

  return (
    <section className="si card">
      <div className="iv-head">
        <div className="card-title">الفواتير</div>
        <button
          type="button"
          className="iv-add"
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "إغلاق" : "＋ فاتورة جديدة"}
        </button>
      </div>

      {showForm && (
        <form className="iv-form" onSubmit={submit}>
          {/* النوع */}
          <div className="iv-types">
            {INVOICE_TYPES.map((tp) => (
              <button
                type="button"
                key={tp}
                className={type === tp ? "iv-type on" : "iv-type"}
                onClick={() => setType(tp)}
              >
                {INVOICE_TYPE_LABEL[tp]}
              </button>
            ))}
          </div>

          <div className="iv-row2">
            <input
              className="input"
              placeholder="اسم الزبون (اختياري)"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
            />
            <input
              className="input"
              placeholder="هاتف الزبون (اختياري)"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
            />
          </div>

          {/* البنود */}
          <div className="iv-items">
            {rows.map((r) => (
              <div className="iv-item" key={r.key}>
                {type === "sale" && availableItems.length > 0 && (
                  <select
                    className="input"
                    value={r.shop_item_id ?? ""}
                    onChange={(e) => pickInventory(r.key, e.target.value)}
                  >
                    <option value="">— من المخزون (اختياري) —</option>
                    {availableItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  className="input"
                  placeholder="الوصف"
                  value={r.description}
                  onChange={(e) => setRow(r.key, { description: e.target.value })}
                />
                <div className="iv-nums">
                  <input
                    className="input no-spin"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="الوزن (غ)"
                    value={r.weight}
                    onChange={(e) => setRow(r.key, { weight: e.target.value })}
                  />
                  <select
                    className="input"
                    value={r.karat}
                    onChange={(e) => setRow(r.key, { karat: e.target.value })}
                  >
                    {ITEM_KARATS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input no-spin"
                    type="number"
                    inputMode="numeric"
                    placeholder="سعر الغرام"
                    value={r.price_per_gram}
                    onChange={(e) => setRow(r.key, { price_per_gram: e.target.value })}
                  />
                  <input
                    className="input no-spin"
                    type="number"
                    inputMode="numeric"
                    placeholder="أجرة الصناعة"
                    value={r.making_fee}
                    onChange={(e) => setRow(r.key, { making_fee: e.target.value })}
                  />
                  <input
                    className="input no-spin"
                    type="number"
                    inputMode="numeric"
                    placeholder="الكمية"
                    value={r.quantity}
                    onChange={(e) => setRow(r.key, { quantity: e.target.value })}
                  />
                </div>
                <div className="iv-linebottom">
                  <span className="iv-linetotal">{fmt(rowTotal(r))}</span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="iv-remove"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    >
                      حذف البند
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="iv-addrow" onClick={() => setRows((rs) => [...rs, emptyRow()])}>
              ＋ بند
            </button>
          </div>

          {/* الإجماليات */}
          <div className="iv-totals">
            <div className="iv-trow">
              <span className="muted">المجموع</span>
              <b>{fmt(subtotal)}</b>
            </div>
            <div className="iv-trow">
              <span className="muted">الخصم</span>
              <input
                className="input no-spin iv-disc"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="iv-trow iv-grand">
              <span>الإجمالي</span>
              <b className="iv-gold">{fmt(total)}</b>
            </div>
          </div>

          <textarea
            className="input"
            placeholder="ملاحظات (اختياري)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ resize: "vertical" }}
          />

          <div className="iv-actions">
            <button type="button" className="iv-cancel" onClick={() => setShowForm(false)}>
              إلغاء
            </button>
            <button type="submit" className="iv-save" disabled={busy}>
              {busy ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
            </button>
          </div>
        </form>
      )}

      {/* قائمة الفواتير */}
      {loading ? (
        <p className="muted">جارٍ التحميل…</p>
      ) : invoices.length === 0 ? (
        <p className="muted">لا توجد فواتير بعد.</p>
      ) : (
        <div className="iv-list">
          {invoices.map((inv) => (
            <div className={inv.status === "void" ? "iv-li void" : "iv-li"} key={inv.id}>
              <div className="iv-li-main">
                <span className="iv-num">#{inv.number}</span>
                <span className="iv-badge">{INVOICE_TYPE_LABEL[inv.type]}</span>
                <span className="iv-cust">{inv.customer_name || "—"}</span>
                {inv.status === "void" && <span className="iv-voidtag">ملغاة</span>}
              </div>
              <div className="iv-li-side">
                <span className="iv-total">{fmt(inv.total)}</span>
                <span className="muted iv-date">{dateFmt(inv.created_at)}</span>
              </div>
              <div className="iv-li-actions">
                <button type="button" className="iv-btn" onClick={() => openReceipt(inv)}>
                  🖨️ طباعة
                </button>
                {inv.status !== "void" && (
                  <button type="button" className="iv-btn iv-del" disabled={busy} onClick={() => doVoid(inv)}>
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الإيصال القابل للطباعة */}
      {receipt && (
        <div id="invoice-print" className="rcpt">
          <button type="button" className="rcpt-close no-print" onClick={() => setReceipt(null)}>
            ✕
          </button>
          <div className="rcpt-head">
            <div className="rcpt-shop">{shop.name ?? "المحل"}</div>
            {shop.phone ? <div className="rcpt-sub">{shop.phone}</div> : null}
          </div>
          <div className="rcpt-meta">
            <span>فاتورة {INVOICE_TYPE_LABEL[receipt.inv.type]} #{receipt.inv.number}</span>
            <span>{dateFmt(receipt.inv.created_at)}</span>
          </div>
          {receipt.inv.customer_name && (
            <div className="rcpt-cust">
              الزبون: {receipt.inv.customer_name}
              {receipt.inv.customer_phone ? ` — ${receipt.inv.customer_phone}` : ""}
            </div>
          )}
          <table className="rcpt-table">
            <thead>
              <tr>
                <th>الوصف</th>
                <th>الوزن</th>
                <th>العيار</th>
                <th>سعر الغرام</th>
                <th>الأجرة</th>
                <th>الكمية</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.description || "—"}</td>
                  <td>{it.weight != null ? `${it.weight} غ` : "—"}</td>
                  <td>{it.karat ?? "—"}</td>
                  <td>{it.price_per_gram != null ? fmt(it.price_per_gram) : "—"}</td>
                  <td>{it.making_fee ? fmt(it.making_fee) : "—"}</td>
                  <td>{it.quantity}</td>
                  <td>{fmt(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rcpt-totals">
            <div><span>المجموع</span><b>{fmt(receipt.inv.subtotal)}</b></div>
            {receipt.inv.discount > 0 && (
              <div><span>الخصم</span><b>{fmt(receipt.inv.discount)}</b></div>
            )}
            <div className="rcpt-grand"><span>الإجمالي</span><b>{fmt(receipt.inv.total)}</b></div>
          </div>
          {receipt.inv.notes ? <div className="rcpt-notes">{receipt.inv.notes}</div> : null}
          <div className="rcpt-foot">شكراً لتعاملكم معنا · Goldary</div>
          <button type="button" className="rcpt-print no-print" onClick={() => window.print()}>
            🖨️ طباعة
          </button>
        </div>
      )}

      <style jsx>{`
        .iv-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
        }
        .iv-add {
          border: 0;
          border-radius: 999px;
          padding: 9px 16px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          white-space: nowrap;
        }
        .iv-form {
          border: 1px dashed rgba(215, 180, 90, 0.4);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 16px;
          display: grid;
          gap: 12px;
        }
        .iv-types {
          display: flex;
          gap: 8px;
        }
        .iv-type {
          flex: 1;
          border: 1px solid rgba(215, 180, 90, 0.35);
          background: transparent;
          color: var(--muted);
          border-radius: 10px;
          padding: 9px;
          font-weight: 700;
          cursor: pointer;
        }
        .iv-type.on {
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
          border-color: transparent;
        }
        .iv-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .iv-items {
          display: grid;
          gap: 12px;
        }
        .iv-item {
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 8px;
          background: rgba(0, 0, 0, 0.15);
        }
        .iv-nums {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .iv-linebottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iv-linetotal {
          font-weight: 800;
          color: var(--gold2);
        }
        .iv-remove {
          background: transparent;
          border: 1px solid rgba(220, 60, 60, 0.4);
          color: #e66;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .iv-addrow {
          border: 1px dashed rgba(215, 180, 90, 0.5);
          background: transparent;
          color: var(--gold2);
          border-radius: 10px;
          padding: 8px;
          cursor: pointer;
          font-weight: 700;
        }
        .iv-totals {
          display: grid;
          gap: 6px;
          border-top: 1px solid var(--stroke);
          padding-top: 10px;
        }
        .iv-trow {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .iv-disc {
          width: 140px;
          text-align: end;
        }
        .iv-grand {
          font-size: 18px;
          font-weight: 800;
        }
        .iv-gold {
          color: var(--gold2);
        }
        .iv-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .iv-cancel {
          background: transparent;
          border: 1px solid rgba(215, 180, 90, 0.35);
          color: var(--muted);
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
        }
        .iv-save {
          border: 0;
          border-radius: 10px;
          padding: 9px 18px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .iv-save:disabled {
          opacity: 0.6;
        }
        .iv-list {
          display: grid;
          gap: 10px;
        }
        .iv-li {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .iv-li.void {
          opacity: 0.55;
        }
        .iv-li-main {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .iv-num {
          font-weight: 800;
          color: var(--gold2);
        }
        .iv-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(215, 180, 90, 0.15);
          color: var(--gold2);
        }
        .iv-voidtag {
          font-size: 11px;
          color: #e66;
          border: 1px solid rgba(220, 60, 60, 0.4);
          border-radius: 999px;
          padding: 1px 8px;
        }
        .iv-li-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .iv-total {
          font-weight: 800;
        }
        .iv-date {
          font-size: 12px;
        }
        .iv-li-actions {
          display: flex;
          gap: 6px;
        }
        .iv-btn {
          border: 1px solid rgba(215, 180, 90, 0.35);
          background: transparent;
          color: var(--gold2);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .iv-del {
          color: #e66;
          border-color: rgba(220, 60, 60, 0.4);
        }
        @media (max-width: 600px) {
          .iv-nums {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* الإيصال — على الشاشة كنافذة */
        .rcpt {
          position: fixed;
          inset: 0;
          margin: auto;
          width: min(720px, 94vw);
          height: fit-content;
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          color: #111;
          border-radius: 12px;
          padding: 24px;
          z-index: 5000;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }
        .rcpt-close {
          position: absolute;
          top: 10px;
          inset-inline-end: 12px;
          border: 0;
          background: #eee;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
        }
        .rcpt-head {
          text-align: center;
          border-bottom: 2px solid #d7b45a;
          padding-bottom: 10px;
        }
        .rcpt-shop {
          font-size: 22px;
          font-weight: 900;
          color: #8a6d1f;
        }
        .rcpt-sub {
          color: #555;
          font-size: 13px;
        }
        .rcpt-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-weight: 700;
          font-size: 14px;
        }
        .rcpt-cust {
          margin-top: 6px;
          font-size: 14px;
        }
        .rcpt-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 13px;
        }
        .rcpt-table th,
        .rcpt-table td {
          border: 1px solid #ddd;
          padding: 6px 8px;
          text-align: center;
        }
        .rcpt-table th {
          background: #faf3df;
        }
        .rcpt-totals {
          margin-top: 12px;
          display: grid;
          gap: 4px;
          margin-inline-start: auto;
          width: 260px;
        }
        .rcpt-totals > div {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .rcpt-grand {
          border-top: 2px solid #d7b45a;
          padding-top: 6px;
          font-size: 17px;
          font-weight: 900;
        }
        .rcpt-notes {
          margin-top: 12px;
          font-size: 13px;
          color: #555;
        }
        .rcpt-foot {
          text-align: center;
          margin-top: 18px;
          color: #8a6d1f;
          font-weight: 700;
        }
        .rcpt-print {
          display: block;
          margin: 16px auto 0;
          border: 0;
          border-radius: 8px;
          padding: 9px 20px;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
        }
      `}</style>

      {/* قواعد الطباعة — عامة لعزل الإيصال فقط */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #invoice-print,
          #invoice-print * {
            visibility: visible !important;
          }
          #invoice-print {
            position: absolute !important;
            inset: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
