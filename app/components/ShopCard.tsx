import {
  pricesByKarat,
  type ShopWithPrices,
  type ShopKarat,
} from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import { fmt } from "@/app/lib/goldPricing";

const KARAT_ORDER: ShopKarat[] = ["24K", "22K", "21K", "18K"];

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

// كارت محل مشترك — يُستعمل في صفحة /shops وفي معاينة الصفحة الرئيسية
export default function ShopCard({ shop }: { shop: ShopWithPrices }) {
  const map = pricesByKarat(shop.prices);

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">{shop.name}</div>
        <div className="muted small">{provinceName(shop.province)}</div>

        <div className="tiny" style={{ display: "grid", gap: 4 }}>
          {KARAT_ORDER.filter((k) => map[k] != null).map((k) => (
            <div key={k} className="row-between">
              <span className="muted">{k}</span>
              <span>{fmt(map[k] as number, "IQD")}</span>
            </div>
          ))}
          {shop.prices.length === 0 && (
            <span className="muted">لا توجد أسعار بعد</span>
          )}
        </div>

        <a href={`/shops/${shop.id}`} className="btn-primary small-btn">
          عرض المحل
        </a>
      </div>
    </div>
  );
}
