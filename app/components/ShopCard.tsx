import {
  pricesByKarat,
  type ShopWithPrices,
} from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import { fmt } from "@/app/lib/goldPricing";

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

// كارت محل مشترك — يُستعمل في صفحة /shops وفي معاينة الصفحة الرئيسية
export default function ShopCard({ shop }: { shop: ShopWithPrices }) {
  const map = pricesByKarat(shop.prices);

  return (
    <div className="card">
      <div className="card-body">
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

        <div className="card-title">{shop.name}</div>
        <div className="muted small">{provinceName(shop.province)}</div>

        <div className="tiny" style={{ display: "grid", gap: 4 }}>
          {shop.prices.length === 0 ? (
            <span className="muted">لا توجد أسعار بعد</span>
          ) : (
            <div className="row-between">
              <span className="muted">21K</span>
              <span>
                {map["21K"] != null ? fmt(map["21K"], "IQD") : "غير متوفر"}
              </span>
            </div>
          )}
        </div>

        <a href={`/shops/${shop.id}`} className="btn-primary small-btn">
          عرض المحل
        </a>
      </div>
    </div>
  );
}
