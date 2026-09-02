"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyItems,
  createItem,
  updateItem,
  setItemStatus,
  publishItem,
  unpublishItem,
  deleteItem,
  uploadItemImage,
  ITEM_KARATS,
  type ShopItem,
  type ItemInput,
  type ShopItemStatus,
} from "@/app/lib/shopItems";
import GalleryGrid from "@/app/components/GalleryGrid";

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

  // النشر/إلغاء النشر عبر API routes
  async function doPublish(id: string) {
    setBusy(id);
    await publishItem(id);
    await load();
    setBusy(null);
  }
  async function doUnpublish(id: string) {
    setBusy(id);
    await unpublishItem(id);
    await load();
    setBusy(null);
  }

  // تبديل العرض مباشرة من المخزن: منشور ⇄ مسودة
  async function togglePublish(it: ShopItem) {
    if (it.status === "published") await doUnpublish(it.id);
    else await doPublish(it.id);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه القطعة نهائياً؟")) return;
    setBusy(id);
    await deleteItem(id);
    await load();
    setBusy(null);
  }

  const sold = items.filter((i) => i.status === "sold");
  const totalSales = sold.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const saleDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

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
          <GalleryGrid
            cols="3-4"
            square
            placeholder="💍"
            tiles={items.map((it) => {
              const imgs = it.image_urls?.length
                ? it.image_urls
                : it.image_url
                ? [it.image_url]
                : [];
              const isPub = it.status === "published";
              return {
                key: it.id,
                thumb: it.image_url,
                images: imgs,
                alt: it.name,
                count: imgs.length,
                statusLabel: STATUS_LABEL[it.status],
                statusStyle: {
                  background: STATUS_COLOR[it.status].bg,
                  color: STATUS_COLOR[it.status].color,
                },
                onEdit: () => {
                  setEditing(it);
                  setShowForm(true);
                },
                actions: [
                  {
                    key: "toggle",
                    label: busy === it.id ? "…" : isPub ? "🙈 إخفاء من المعرض" : "👁️ عرض بالمعرض",
                    variant: (isPub ? "hide" : "show") as "hide" | "show",
                    disabled: busy === it.id,
                    onClick: () => togglePublish(it),
                  },
                  {
                    key: "del",
                    label: "حذف",
                    variant: "danger" as const,
                    disabled: busy === it.id,
                    onClick: () => remove(it.id),
                  },
                ],
              };
            })}
          />
        )}
      </section>

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
        /* نفس شبكة معرض الصور: مربعات صغيرة — 3 بالصف موبايل، 4 ديسكتوب */
        .si-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (min-width: 768px) {
          .si-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .si-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .si-cellbtns {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .si-cell-del {
          width: 100%;
          border: 1px solid rgba(220, 60, 60, 0.4);
          background: transparent;
          color: #e66;
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 13px;
          cursor: pointer;
        }
        .si-cell-del:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .si-card {
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(215, 180, 90, 0.18);
          border-radius: 14px;
          overflow: hidden;
        }
        .si-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
          cursor: zoom-in;
        }
        .si-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .si-count {
          position: absolute;
          bottom: 6px;
          inset-inline-end: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .si-status {
          position: absolute;
          top: 6px;
          inset-inline-start: 6px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 700;
        }
        .si-edit {
          position: absolute;
          top: 6px;
          inset-inline-end: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(215, 180, 90, 0.5);
          background: rgba(0, 0, 0, 0.6);
          color: #f2d27b;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 0;
        }
        .si-edit:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        .si-noimg {
          font-size: 34px;
        }
        .si-body {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .si-name {
          font-weight: 700;
          color: var(--gold2);
          font-size: 14px;
        }
        .si-meta {
          color: var(--muted);
          font-size: 12px;
        }
        .si-toggle {
          width: 100%;
          border-radius: 10px;
          padding: 7px 6px;
          font-weight: 700;
          font-size: 12px;
          line-height: 1.25;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .si-toggle:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .si-toggle.si-show {
          background: rgba(60, 180, 90, 0.15);
          color: #43c66a;
          border-color: rgba(60, 180, 90, 0.45);
        }
        .si-toggle.si-hide {
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .si-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 6px;
        }
        .si-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(215, 180, 90, 0.12);
          border: 1px solid rgba(215, 180, 90, 0.28);
          color: var(--gold2);
        }
        .si-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .si-btn {
          flex: 1;
          min-width: 60px;
          text-align: center;
          border: 1px solid rgba(215, 180, 90, 0.35);
          background: transparent;
          color: var(--gold2);
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 13px;
          cursor: pointer;
        }
        .si-btn:disabled {
          opacity: 0.5;
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
  onCancel,
  onSave,
}: {
  initial: ShopItem | null;
  onCancel: () => void;
  onSave: (input: ItemInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [karat, setKarat] = useState(initial?.karat ?? "21K");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join("، "));
  const [images, setImages] = useState<string[]>(
    initial?.image_urls?.length ? initial.image_urls : initial?.image_url ? [initial.image_url] : []
  );
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const f of files) {
      const url = await uploadItemImage(f);
      if (url) uploaded.push(url);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = ""; // للسماح برفع نفس الملف مجدداً
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }
  function makeCover(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  // ترتيب الصور بالسحب (Pointer Events — لمس + ماوس). الأولى = الغلاف.
  const dragIdx = useRef<number | null>(null);
  const moved = useRef(false);
  const [dragging, setDragging] = useState<number | null>(null);

  function reorder(from: number, to: number) {
    setImages((prev) => {
      if (from === to || from < 0 || to < 0) return prev;
      const arr = [...prev];
      const [x] = arr.splice(from, 1);
      arr.splice(to, 0, x);
      return arr;
    });
  }
  function startDrag(e: React.PointerEvent, i: number) {
    dragIdx.current = i;
    moved.current = false;
    setDragging(i);
  }
  function onMove(e: React.PointerEvent) {
    if (dragIdx.current == null) return;
    moved.current = true;
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
      "[data-thumb]"
    ) as HTMLElement | null;
    if (!el) return;
    const to = Number(el.dataset.idx);
    const from = dragIdx.current;
    if (!Number.isNaN(to) && to !== from) {
      reorder(from, to);
      dragIdx.current = to;
      setDragging(to);
    }
  }
  function endDrag() {
    dragIdx.current = null;
    setDragging(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const tags = Array.from(
      new Set(
        tagsText
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    setBusy(true);
    await onSave({
      name: name.trim(),
      image_urls: images,
      weight: weight ? Number(weight) : null,
      karat,
      description: description.trim() || null,
      tags,
    });
    setBusy(false);
  }

  return (
    <form className="if" onSubmit={submit}>
      {/* صور متعددة — أول صورة = الغلاف */}
      <div
        className="if-images"
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {images.map((url, i) => (
          <div
            className={dragging === i ? "if-thumb dragging" : "if-thumb"}
            key={url}
            data-thumb
            data-idx={i}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              draggable={false}
              onPointerDown={(e) => startDrag(e, i)}
              onClick={() => {
                if (!moved.current) makeCover(url);
              }}
            />
            {i === 0 && <span className="if-cover-badge">غلاف</span>}
            <button
              type="button"
              className="if-thumb-x"
              onClick={() => removeImage(url)}
              aria-label="حذف الصورة"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="if-addimg">
          {uploading ? <span>جارٍ الرفع…</span> : <span>＋ صور</span>}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onFiles}
            disabled={uploading}
          />
        </label>
      </div>
      {images.length > 1 && (
        <p className="if-hint">اسحبي الصور لإعادة ترتيبها · انقري صورة لجعلها الغلاف.</p>
      )}

      <div className="if-top">
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
              className="input no-spin"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="أدخل الوزن بالجرام"
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
          <textarea
            className="input"
            placeholder="وصف القطعة (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ resize: "vertical" }}
          />
          <input
            className="input"
            placeholder="وسوم للبحث — افصلي بينها بفاصلة: سوار، خاتم، ذهب"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
          />
          <p className="if-hint" style={{ margin: 0 }}>
            الوسوم تساعد الزبائن على إيجاد القطعة بالبحث (قطعة واحدة قد تظهر تحت عدة وسوم).
          </p>
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
        .if-images {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .if-thumb {
          position: relative;
          width: 82px;
          height: 82px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(215, 180, 90, 0.35);
          transition: transform 0.12s ease, opacity 0.12s ease;
        }
        .if-thumb.dragging {
          opacity: 0.6;
          transform: scale(1.06);
          border-color: var(--gold2);
          z-index: 2;
        }
        .if-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        .if-cover-badge {
          position: absolute;
          bottom: 4px;
          inset-inline-start: 4px;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          color: #111;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .if-thumb-x {
          position: absolute;
          top: 3px;
          inset-inline-end: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 0;
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
        }
        .if-addimg {
          width: 82px;
          height: 82px;
          border-radius: 12px;
          border: 1px dashed rgba(215, 180, 90, 0.5);
          display: grid;
          place-items: center;
          cursor: pointer;
          color: var(--gold2);
          font-size: 12px;
          text-align: center;
          flex-shrink: 0;
        }
        .if-hint {
          color: var(--muted);
          font-size: 12px;
          margin: 0 0 10px;
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
        /* إخفاء أزرار الـstepper (السهمين) مع إبقاء type=number لكتابة مباشرة */
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spin {
          -moz-appearance: textfield;
          appearance: textfield;
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
