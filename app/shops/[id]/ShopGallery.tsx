"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/app/lib/i18n";

type Props = {
  images: string[];
  shopName: string;
};

export default function ShopGallery({ images, shopName }: Props) {
  const { t } = useT();
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  );

  // سحب بالإصبع في العرض المكبّر
  const touchX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.changedTouches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  }

  // تنقّل بلوحة المفاتيح أثناء فتح العرض المكبّر
  useEffect(() => {
    if (index === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") next(); // RTL: يسار = التالي
      else if (e.key === "ArrowRight") prev(); // RTL: يمين = السابق
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, next, prev]);

  if (images.length === 0) return null;

  const current = index !== null ? images[index] : null;
  const multiple = images.length > 1;

  const navBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    color: "#f2d27b",
    border: "1px solid rgba(215,180,90,0.5)",
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
  };

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 10 }}>{t.gallery}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {images.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={`صورة من ${shopName}`}
            onClick={() => setIndex(i)}
            style={{
              width: "100%",
              height: 120,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {current && (
        <div
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
            touchAction: "pan-y",
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            style={{
              position: "absolute",
              top: 16,
              insetInlineEnd: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              color: "#f2d27b",
              border: "1px solid rgba(215,180,90,0.5)",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ✕
          </button>

          {multiple && (
            <>
              {/* السابق على اليمين (طبيعي بالـ RTL) */}
              <button
                type="button"
                aria-label={t.prev}
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                style={{ ...navBtnStyle, right: 16 }}
              >
                ›
              </button>
              {/* التالي على اليسار */}
              <button
                type="button"
                aria-label={t.next}
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                style={{ ...navBtnStyle, left: 16 }}
              >
                ‹
              </button>
            </>
          )}

          <img
            src={current}
            alt={`صورة من ${shopName}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 12,
              border: "1px solid rgba(215,180,90,0.3)",
            }}
          />
        </div>
      )}
    </div>
  );
}
