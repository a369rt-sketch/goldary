"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  pricesByKarat,
  type ShopKarat,
  type ShopWithPrices,
} from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import { fmt } from "@/app/lib/goldPricing";
import { useT } from "@/app/lib/i18n";
import { getPublishedByShop, type ShopItem } from "@/app/lib/shopItems";
import ShopGallery from "./ShopGallery";
import Lightbox from "./Lightbox";

// بطاقة قطعة بمعرض صور قابل للتبديل
function PieceCard({ it }: { it: ShopItem }) {
  const imgs = it.image_urls?.length ? it.image_urls : it.image_url ? [it.image_url] : [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const current = imgs[active] ?? null;
  const touchX = useRef<number | null>(null);

  const swiped = useRef(false);

  const go = (dir: 1 | -1) =>
    setActive((a) => (a + dir + imgs.length) % imgs.length);

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
                  i === active
                    ? "2px solid var(--gold2)"
                    : "1px solid rgba(255,255,255,0.15)",
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

// معروضات المحل — القطع المنشورة (status='published') فقط
function ShopShowcase({ ownerId }: { ownerId: string }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    getPublishedByShop(ownerId).then(setItems);
  }, [ownerId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const inName = it.name.toLowerCase().includes(q);
      const inTags = (it.tags ?? []).some((tg) => tg.toLowerCase().includes(q));
      return inName || inTags;
    });
  }, [items, query]);

  if (items.length === 0) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 10 }}>معروضات المحل</div>

      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحثي بالوسم أو الاسم… (مثال: خاتم، سوار)"
        style={{ width: "100%", marginBottom: 12 }}
      />

      {filtered.length === 0 ? (
        <p className="muted">لا توجد قطع مطابقة لبحثك.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((it) => (
            <PieceCard key={it.id} it={it} />
          ))}
        </div>
      )}
    </div>
  );
}

const KARAT_ORDER: ShopKarat[] = ["24K", "22K", "21K", "18K"];
const KARAT_VALUE: Record<ShopKarat, string> = {
  "24K": "24",
  "22K": "22",
  "21K": "21",
  "18K": "18",
};

const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

// تطبيع رقم الواتساب لصيغة wa.me (أرقام عراقية: 0 في البداية → 964)
function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
}

export default function ShopView({ shop }: { shop: ShopWithPrices }) {
  const { t } = useT();
  const map = pricesByKarat(shop.prices);

  const gallery =
    (shop as { gallery_urls?: string[] | null }).gallery_urls ?? [];
  const karats = (shop as { karats?: string[] | null }).karats ?? [];

  const displayKarats =
    karats.length > 0
      ? KARAT_ORDER.filter((k) => karats.includes(KARAT_VALUE[k]))
      : KARAT_ORDER.filter((k) => map[k] != null);

  return (
    <main className="container">
      <div className="row-between">
        <div className="row" style={{ alignItems: "center", gap: 14 }}>
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logo_url}
              alt={shop.name}
              width={56}
              height={56}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                objectFit: "cover",
                border: "1px solid rgba(215,180,90,0.25)",
              }}
            />
          ) : null}
          <h1 className="title" style={{ margin: 0, fontSize: 40 }}>{shop.name}</h1>
        </div>
        <a href="/shops" className="btn-secondary">{t.back_to_shops}</a>
      </div>

      <div className="card">
        <div className="card-title">{provinceName(shop.province)}</div>
        {shop.address ? (
          <div className="muted" style={{ marginTop: 6 }}>{shop.address}</div>
        ) : null}

        {(shop.phone || shop.whatsapp) && (
          <div className="row" style={{ marginTop: 14 }}>
            {shop.phone ? (
              <a href={`tel:${shop.phone}`} className="btn-primary small-btn">
                {t.call}
              </a>
            ) : null}
            {shop.whatsapp ? (
              <a
                href={`https://wa.me/${waNumber(shop.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary small-btn"
              >
                {t.whatsapp}
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>{t.prices_today}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {displayKarats.map((k) => (
            <div key={k} className="row-between">
              <span className="muted">{k}</span>
              <span>
                {map[k] != null ? fmt(map[k] as number, "IQD") : t.shop_not_available}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(shop as { owner_id?: string }).owner_id ? (
        <ShopShowcase ownerId={(shop as { owner_id?: string }).owner_id as string} />
      ) : null}

      <ShopGallery images={gallery} shopName={shop.name} />
    </main>
  );
}
