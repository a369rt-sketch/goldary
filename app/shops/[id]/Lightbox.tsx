"use client";

import { useCallback, useEffect, useRef } from "react";

// عارض صور مكبّر (fullscreen) — تنقّل بالأسهم/اللمس/لوحة المفاتيح.
// مُتحكَّم به من الأب عبر index (null = مغلق).
export default function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
  alt = "",
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
  alt?: string;
}) {
  const multiple = images.length > 1;

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);
  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  const touchX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.changedTouches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null || !multiple) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  }

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") next(); // RTL: يسار = التالي
      else if (e.key === "ArrowRight") prev(); // RTL: يمين = السابق
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, next, prev]);

  if (index === null) return null;
  const current = images[index];
  if (!current) return null;

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
    <div
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
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
        onClick={onClose}
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
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              textAlign: "center",
              color: "#f2d27b",
              fontSize: 13,
            }}
          >
            {index + 1} / {images.length}
          </div>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={alt}
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
  );
}
