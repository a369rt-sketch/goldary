"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMyItems,
  createItem,
  updateItem,
  setItemStatus,
  deleteItem,
  uploadItemImage,
  ITEM_KARATS,
  type ShopItem,
  type ItemInput,
  type ShopItemStatus,
} from "@/app/lib/shopItems";

const STATUS_LABEL: Record<ShopItemStatus, string> = {
  draft: "مسودة",
  published: "معروض",
  sold: "مُباع",
};
const STATUS_COLOR: Record<ShopItemStatus, { bg: string; color: string }> = {
  draft: { bg: "rgba(160,160,160,0.15)", color: "#9aa" },
  published: { bg: "rgba(60,180,90,0.15)", color: "#43c66a" },
  sold: { bg: "rgba(215,180,90,0.15)", color: "#f2d27b" },
};

const fmt = (n: number | null) =>
  n != null ? `${Math.round(n).toLocaleString("en-US")} د.ع` : "—";

export default function ShopInventory({ shopUserId }: { shopUserId: string }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await getMyItems(shopUserId));
    setLoading(false);
  }, [shopUserId]);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  async function handleSave(input: ItemInput) {
    if (editing) await updateItem(editing.id, input);
    else await createItem(shopUserId, input);
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function changeStatus(id: string, status: ShopItemStatus) {
    setBusy(id);
    await setItemStatus(id, status);
    if (status === "sold") {
      const it = items.find((i) => i.id === id);
      notify(`🎉 تم تسجيل بيع «${it?.name ?? "قطعة"}»${it?.price != null ? ` بمبلغ ${fmt(it.price)}` : ""}`);
    }
    await load();
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه القطعة نهائياً؟")) return;
    setBusy(id);
    await deleteItem(id);
    await load();
    setBusy(null);
  }

  const published = items.filter((i) => i.status === "published");
  const sold = items.filter((i) => i.status === "sold");
  const totalSales = sold.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const saleDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

  const Thumb = ({ it }: { it: ShopItem }) => (
    <div className="si-media">
      {it.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image_url} alt={it.name} />
      ) : (
        <span className="si-noimg">💍</span>
      )}
    </div>
  );

  const Info = ({ it }: { it: ShopItem }) => (
    <div className="si-info">
      <div className="si-name">
        {it.name}
        <span
          className="si-badge"
          style={{ background: STATUS_COLOR[it.status].bg, color: STATUS_COLOR[it.status].color }}
        >
          {STATUS_LABEL[it.status]}
        </span>
      </div>
      <div className="si-meta">
        {it.karat ?? "—"} · {it.weight != null ? `${it.weight} غ` : "—"} · {fmt(it.price)}
      </div>
    </div>
  );

  return (
    <>
      {/* إشعار بيع فوري */}
      {toast && <div className="si-toast">{toast}</div>}

      {/* ملخّص المبيعات (إشعار دائم) */}
      {sold.length > 0 && (
        <div className="si-sales-banner">
          💰 <b>{sold.length}</b> قطعة مباعة · إجمالي المبيعات{" "}
          <b className="si-gold">{fmt(totalSales)}</b>
        </div>
      )}

      {/* قسم أ: مخزوني */}
      <section className="si card">
        <div className="si-head">
          <div className="card-title">مخزوني — كل القطع</div>
          <button
            type="button"
            className="si-add"
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm && !editing ? "إغلاق" : "＋ إضافة قطعة جديدة"}
          </button>
        </div>

        {(showForm || editing) && (
          <ItemForm
            key={editing?.id ?? "new"}
            initial={editing}
            shopUserId={shopUserId}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        )}

        {loading ? (
          <p className="muted">جارٍ التحميل…</p>
        ) : items.length === 0 ? (
          <p className="muted">لا توجد قطع بعد. أضيفي أول قطعة ✨</p>
        ) : (
          <div className="si-grid">
            {items.map((it) => (
              <div className="si-item" key={it.id}>
                <Thumb it={it} />
                <Info it={it} />
                <div className="si-actions">
                  <button
                    className="si-btn"
                    onClick={() => {
                      setEditing(it);
                      setShowForm(true);
                    }}
                  >
                    تعديل
                  </button>
                  {it.status === "draft" && (
                    <button
                      className="si-btn si-pub"
                      disabled={busy === it.id}
                      onClick={() => changeStatus(it.id, "published")}
                    >
                      نشر للعرض العام
                    </button>
                  )}
                  <button
                    className="si-btn si-del"
                    disabled={busy === it.id}
                    onClick={() => remove(it.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* قسم ب: المعروض حالياً */}
      <section className="si card">
        <div className="card-title" style={{ marginBottom: 12 }}>
          المعروض حالياً ({published.length})
        </div>
        {published.length === 0 ? (
          <p className="muted">لا توجد قطع معروضة. انشري قطعة من مخزونك.</p>
        ) : (
          <div className="si-grid">
            {published.map((it) => (
              <div className="si-item" key={it.id}>
                <Thumb it={it} />
                <Info it={it} />
                <div className="si-actions">
                  <button
                    className="si-btn"
                    disabled={busy === it.id}
                    onClick={() => changeStatus(it.id, "draft")}
                  >
                    إلغاء النشر
                  </button>
                  <button
                    className="si-btn si-sold"
                    disabled={busy === it.id}
                    onClick={() => changeStatus(it.id, "sold")}
                  >
                    تم البيع
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* قسم المبيعات */}
      {sold.length > 0 && (
        <section className="si card">
          <div className="card-title" style={{ marginBottom: 12 }}>
            المبيعات ({sold.length}) — {fmt(totalSales)}
          </div>
          <div className="si-grid">
            {sold.map((it) => (
              <div className="si-item si-solditem" key={it.id}>
                <Thumb it={it} />
                <div className="si-info">
                  <div className="si-name">{it.name}</div>
                  <div className="si-meta">
                    {it.karat ?? "—"} · {fmt(it.price)} · بيعت {saleDate(it.updated_at)}
                  </div>
                </div>
                <div className="si-actions">
                  <button
                    className="si-btn"
                    disabled={busy === it.id}
                    onClick={() => changeStatus(it.id, "draft")}
                  >
                    إرجاع للمخزن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        .si-toast {
          position: fixed;
          bottom: 24px;
          inset-inline-start: 50%;
          transform: translateX(50%);
          z-index: 4500;
          max-width: 90vw;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
          font-weight: 800;
          padding: 12px 20px;
          border-radius: 999px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: siToast 0.3s ease;
        }
        @keyframes siToast {
          from {
            opacity: 0;
            transform: translate(50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(50%, 0);
          }
        }
        .si-sales-banner {
          max-width: 720px;
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(60, 180, 90, 0.4);
          background: rgba(60, 180, 90, 0.12);
          color: var(--text);
          font-size: 14px;
        }
        .si-gold {
          color: var(--gold2);
        }
        .si-solditem {
          opacity: 0.85;
        }
        .si {
          max-width: 720px;
        }
        .si-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
        }
        .si-add {
          border: 0;
          border-radius: 999px;
          padding: 9px 16px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          white-space: nowrap;
        }
        .si-grid {
          display: grid;
          gap: 12px;
        }
        .si-item {
          display: flex;
          gap: 12px;
          align-items: center;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 14px;
          padding: 10px;
          flex-wrap: wrap;
        }
        .si-media {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
        }
        .si-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .si-noimg {
          font-size: 24px;
        }
        .si-info {
          flex: 1;
          min-width: 140px;
        }
        .si-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-weight: 700;
          color: var(--gold2);
        }
        .si-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
        }
        .si-meta {
          color: var(--muted);
          font-size: 13px;
          margin-top: 4px;
        }
        .si-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .si-btn {
          border: 1px solid rgba(215, 180, 90, 0.35);
          background: transparent;
          color: var(--gold2);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .si-btn:disabled {
          opacity: 0.5;
        }
        .si-pub {
          background: rgba(60, 180, 90, 0.15);
          color: #43c66a;
          border-color: rgba(60, 180, 90, 0.4);
        }
        .si-sold {
          background: rgba(215, 180, 90, 0.15);
          border-color: rgba(215, 180, 90, 0.5);
        }
        .si-del {
          color: #e66;
          border-color: rgba(220, 60, 60, 0.4);
        }
      `}</style>
    </>
  );
}

// ---------- نموذج إضافة/تعديل قطعة ----------
function ItemForm({
  initial,
  shopUserId,
  onCancel,
  onSave,
}: {
  initial: ShopItem | null;
  shopUserId: string;
  onCancel: () => void;
  onSave: (input: ItemInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [karat, setKarat] = useState(initial?.karat ?? "21K");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadItemImage(file, shopUserId);
    setUploading(false);
    if (url) setImageUrl(url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onSave({
      name: name.trim(),
      image_url: imageUrl,
      weight: weight ? Number(weight) : null,
      karat,
      price: price ? Number(price) : null,
    });
    setBusy(false);
  }

  return (
    <form className="if" onSubmit={submit}>
      <div className="if-top">
        <label className="if-image">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" />
          ) : uploading ? (
            <span>جارٍ الرفع…</span>
          ) : (
            <span>＋ صورة</span>
          )}
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
        <div className="if-fields">
          <input
            className="input"
            placeholder="اسم القطعة"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="if-row">
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="الوزن (غرام)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <select className="input" value={karat} onChange={(e) => setKarat(e.target.value)}>
              {ITEM_KARATS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="السعر (د.ع)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      <div className="if-actions">
        <button type="button" className="if-cancel" onClick={onCancel}>
          إلغاء
        </button>
        <button type="submit" className="if-save" disabled={busy || uploading}>
          {busy ? "جارٍ الحفظ…" : initial ? "حفظ التعديلات" : "إضافة للمخزن"}
        </button>
      </div>

      <style jsx>{`
        .if {
          border: 1px dashed rgba(215, 180, 90, 0.4);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .if-top {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .if-image {
          width: 90px;
          height: 90px;
          border-radius: 12px;
          border: 1px solid rgba(215, 180, 90, 0.35);
          display: grid;
          place-items: center;
          cursor: pointer;
          overflow: hidden;
          color: var(--gold2);
          font-size: 13px;
          text-align: center;
          flex-shrink: 0;
        }
        .if-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .if-fields {
          flex: 1;
          min-width: 200px;
          display: grid;
          gap: 8px;
        }
        .if-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .if-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .if-cancel {
          background: transparent;
          border: 1px solid rgba(215, 180, 90, 0.35);
          color: var(--muted);
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
        }
        .if-save {
          border: 0;
          border-radius: 10px;
          padding: 9px 18px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
      `}</style>
    </form>
  );
}
