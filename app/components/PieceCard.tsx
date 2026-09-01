"use client";

import { useRef, useState } from "react";
import { type ShopItem } from "@/app/lib/shopItems";
import Lightbox from "./Lightbox";

// بطاقة قطعة: معرض صور قابل للتبديل + سحب + عارض مكبّر (lightbox) + وسوم.
// shopName/shopHref اختياريان — يظهران فقط في المعرض العام عبر المحلات.
export default function PieceCard({
  it,
  shopName,
  shopHref,
}: {
  it: ShopItem;
  shopName?: string;
  shopHref?: string;
}) {
  const imgs = it.image_urls?.length ? it.image_urls : it.image_url ? [it.image_url] : [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const current = imgs[active] ?? null;
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  const go = (dir: 1 | -1) => setActive((a) => (a + dir + imgs.length) % imgs.length);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.changedTouches[0].clientX;
    swiped.current = false;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null || imgs.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    swiped.current = true; // منع فتح العارض بعد السحب
    go(dx < 0 ? 1 : -1); // سحب لليسار = التالية، لليمين = السابقة
  }

  function openLightbox() {
    if (swiped.current) return;
    if (current) setLightbox(active);
  }

  return (
    <div
      style={{
        border: "1px solid rgba(215,180,90,0.2)",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{ position: "relative", touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current}
            alt={it.name}
            onClick={openLightbox}
            style={{ width: "100%", height: 160, objectFit: "cover", display: "block", cursor: "zoom-in" }}
          />
        ) : (
          <div style={{ height: 160, display: "grid", placeItems: "center", fontSize: 34 }}>💍</div>
        )}
        {imgs.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 5,
            }}
          >
            {imgs.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: i === active ? "#f2d27b" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "8px 8px 0", flexWrap: "wrap" }}>
          {imgs.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => setActive(i)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                border:
                  i === active ? "2px solid var(--gold2)" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 700, color: "var(--gold2)" }}>{it.name}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {it.karat ?? "—"} · {it.weight != null ? `${it.weight} غ` : "—"}
        </div>
        {shopName && shopHref ? (
          <a
            href={shopHref}
            style={{ display: "inline-block", fontSize: 12, marginTop: 6, color: "var(--gold2)", textDecoration: "none" }}
          >
            🏪 {shopName}
          </a>
        ) : null}
        {it.description ? (
          <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            {it.description}
          </div>
        ) : null}
        {it.tags && it.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {it.tags.map((tg) => (
              <span
                key={tg}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(215,180,90,0.12)",
                  border: "1px solid rgba(215,180,90,0.28)",
                  color: "var(--gold2)",
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        images={imgs}
        index={lightbox}
        alt={it.name}
        onClose={() => setLightbox(null)}
        onNavigate={(n) => {
          setLightbox(n);
          setActive(n);
        }}
      />
    </div>
  );
}
