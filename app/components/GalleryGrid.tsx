"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

// خلية واحدة في الشبكة: صورة مصغّرة + شارات اختيارية فوقها + أزرار اختيارية تحتها.
export type GalleryTile = {
  key: string;
  thumb: string | null; // صورة الغلاف
  images?: string[]; // مجموعة صور العارض المكبّر (افتراضياً [thumb])
  start?: number; // فهرس البداية في العارض
  alt?: string;
  count?: number; // يظهر 📷N إذا > 1
  statusLabel?: string; // شارة حالة فوق الصورة
  statusStyle?: React.CSSProperties;
  onEdit?: () => void; // يظهر زر ✏️ في الزاوية
  actions?: Array<{
    key: string;
    label: React.ReactNode;
    onClick: () => void;
    variant: "show" | "hide" | "danger";
    disabled?: boolean;
  }>;
};

// شبكة صور موحّدة — يستخدمها معرض الصور والمخزن معاً (نفس التصميم بالضبط).
export default function GalleryGrid({
  tiles,
  cols = "auto",
  square = false,
  placeholder = "🖼️",
}: {
  tiles: GalleryTile[];
  cols?: "auto" | "3-4";
  square?: boolean;
  placeholder?: React.ReactNode;
}) {
  const [lb, setLb] = useState<{ images: string[]; index: number } | null>(null);

  function open(t: GalleryTile) {
    const imgs = t.images?.length ? t.images : t.thumb ? [t.thumb] : [];
    if (imgs.length) setLb({ images: imgs, index: t.start ?? 0 });
  }

  return (
    <>
      <div className={cols === "3-4" ? "gg-grid gg-34" : "gg-grid gg-auto"}>
        {tiles.map((t) => (
          <div className="gg-cell" key={t.key}>
            <div
              className={square ? "gg-thumb gg-square" : "gg-thumb gg-h120"}
              onClick={() => open(t)}
              title="اضغطي للتكبير"
            >
              {t.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.thumb} alt={t.alt ?? ""} />
              ) : (
                <span className="gg-ph">{placeholder}</span>
              )}
              {t.count && t.count > 1 ? <span className="gg-count">📷 {t.count}</span> : null}
              {t.statusLabel ? (
                <span className="gg-status" style={t.statusStyle}>
                  {t.statusLabel}
                </span>
              ) : null}
              {t.onEdit ? (
                <button
                  type="button"
                  className="gg-edit"
                  aria-label="تعديل"
                  title="تعديل"
                  onClick={(e) => {
                    e.stopPropagation();
                    t.onEdit!();
                  }}
                >
                  ✏️
                </button>
              ) : null}
            </div>

            {t.actions?.length ? (
              <div className="gg-footer">
                {t.actions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`gg-btn gg-${a.variant}`}
                    disabled={a.disabled}
                    onClick={a.onClick}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Lightbox
        images={lb?.images ?? []}
        index={lb ? lb.index : null}
        onClose={() => setLb(null)}
        onNavigate={(n) => setLb((s) => (s ? { ...s, index: n } : s))}
      />

      <style jsx>{`
        .gg-grid {
          display: grid;
          gap: 10px;
        }
        .gg-auto {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
        .gg-34 {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (min-width: 768px) {
          .gg-34 {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .gg-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .gg-thumb {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          display: grid;
          place-items: center;
          cursor: zoom-in;
        }
        .gg-square {
          aspect-ratio: 1 / 1;
        }
        .gg-h120 {
          height: 120px;
        }
        .gg-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gg-ph {
          font-size: 30px;
        }
        .gg-count {
          position: absolute;
          bottom: 6px;
          inset-inline-end: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .gg-status {
          position: absolute;
          top: 6px;
          inset-inline-start: 6px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 700;
        }
        .gg-edit {
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
        .gg-edit:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        .gg-footer {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .gg-btn {
          width: 100%;
          border-radius: 10px;
          padding: 7px 6px;
          font-weight: 700;
          font-size: 12px;
          line-height: 1.25;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .gg-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .gg-show {
          background: rgba(60, 180, 90, 0.15);
          color: #43c66a;
          border-color: rgba(60, 180, 90, 0.45);
        }
        .gg-hide {
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .gg-danger {
          background: transparent;
          color: #e66;
          border-color: rgba(220, 60, 60, 0.4);
        }
      `}</style>
    </>
  );
}
