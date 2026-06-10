"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  images: string[];
  shopName: string;
};

export default function ShopGallery({ images, shopName }: Props) {
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
      <div className="card-title" style={{ marginBottom: 10 }}>معرض الصور</div>

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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
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
                aria-label="السابق"
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
                aria-label="التالي"
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
