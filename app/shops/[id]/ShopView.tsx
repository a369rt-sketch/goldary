"use client";

import {
  pricesByKarat,
  type ShopKarat,
  type ShopWithPrices,
} from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import { fmt } from "@/app/lib/goldPricing";
import { useT } from "@/app/lib/i18n";
import ShopGallery from "./ShopGallery";

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

      <ShopGallery images={gallery} shopName={shop.name} />
    </main>
  );
}
