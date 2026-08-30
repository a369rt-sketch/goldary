"use client";

import { useEffect, useState } from "react";
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

// معروضات المحل — القطع المنشورة (status='published') فقط
function ShopShowcase({ ownerId }: { ownerId: string }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  useEffect(() => {
    getPublishedByShop(ownerId).then(setItems);
  }, [ownerId]);

  if (items.length === 0) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 10 }}>معروضات المحل</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              border: "1px solid rgba(215,180,90,0.2)",
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {it.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.image_url}
                alt={it.name}
                style={{ width: "100%", height: 140, objectFit: "cover" }}
              />
            ) : (
              <div style={{ height: 140, display: "grid", placeItems: "center", fontSize: 34 }}>💍</div>
            )}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, color: "var(--gold2)" }}>{it.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {it.karat ?? "—"} · {it.weight != null ? `${it.weight} غ` : "—"}
              </div>
              <div style={{ marginTop: 4 }}>
                {it.price != null ? fmt(it.price, "IQD") : "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
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
