"use client";

import { useEffect, useState } from "react";
import { getShopsWithPrices, type ShopWithPrices } from "@/app/lib/shops";
import ShopCard from "@/app/components/ShopCard";
import { useT } from "@/app/lib/i18n";

// عدد المحلات المعروضة في المعاينة
const PREVIEW_COUNT = 4;

// معاينة محلات في الصفحة الرئيسية — تعرض أول أربعة محلات مع زر لكل المحلات
export default function ShopsPreview() {
  const { t } = useT();
  const [shops, setShops] = useState<ShopWithPrices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await getShopsWithPrices();
      if (!mounted) return;
      setShops(data.slice(0, PREVIEW_COUNT));
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // أثناء التحميل أو عند عدم وجود محلات لا نعرض القسم
  if (loading || shops.length === 0) return null;

  return (
    <section className="shops-preview">
      <div className="row-between">
        <h2 className="title">{t.shops_heading}</h2>
        <a href="/shops" className="btn-secondary">{t.view_all_shops}</a>
      </div>

      <div className="grid">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </section>
  );
}
