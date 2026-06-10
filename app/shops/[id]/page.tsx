import { notFound } from "next/navigation";
import { getShopWithPrices, pricesByKarat, type ShopKarat } from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import { fmt } from "@/app/lib/goldPricing";
import ShopGallery from "./ShopGallery";

const KARAT_ORDER: ShopKarat[] = ["24K", "22K", "21K", "18K"];

// قيمة عمود karats (بدون K) المقابلة لكل عيار
const KARAT_VALUE: Record<ShopKarat, string> = {
  "24K": "24",
  "22K": "22",
  "21K": "21",
  "18K": "18",
};

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

// تطبيع رقم الواتساب لصيغة wa.me (أرقام عراقية: 0 في البداية → 964)
function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShopWithPrices(id);

  if (!shop) {
    notFound();
  }

  const map = pricesByKarat(shop.prices);

  // gallery_urls و karats موجودان وقت التشغيل (select *) بس غير معرّفين بنوع ShopWithPrices
  const gallery =
    (shop as { gallery_urls?: string[] | null }).gallery_urls ?? [];
  const karats = (shop as { karats?: string[] | null }).karats ?? [];

  // العيارات المعروضة: عيارات المحل المختارة، أو fallback لكل عيار له سعر
  const displayKarats =
    karats.length > 0
      ? KARAT_ORDER.filter((k) => karats.includes(KARAT_VALUE[k]))
      : KARAT_ORDER.filter((k) => map[k] != null);

  return (
    <main className="container" dir="rtl">
      <div className="row-between">
        <div className="row" style={{ alignItems: "center", gap: 14 }}>
          {shop.logo_url ? (
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
        <a href="/shops" className="btn-secondary">رجوع للمحلات</a>
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
                اتصال
              </a>
            ) : null}
            {shop.whatsapp ? (
              <a
                href={`https://wa.me/${waNumber(shop.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary small-btn"
              >
                واتساب
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>الأسعار اليوم</div>
        <div style={{ display: "grid", gap: 8 }}>
          {displayKarats.map((k) => (
            <div key={k} className="row-between">
              <span className="muted">{k}</span>
              <span>
                {map[k] != null ? fmt(map[k] as number, "IQD") : "غير متوفر"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ShopGallery images={gallery} shopName={shop.name} />
    </main>
  );
}
