"use client";

import { useEffect, useState } from "react";
import { getShopsWithPrices, type ShopWithPrices } from "@/app/lib/shops";
import ShopCard from "@/app/components/ShopCard";

// عدد المحلات المعروضة في المعاينة
const PREVIEW_COUNT = 4;

// معاينة محلات في الصفحة الرئيسية — تعرض أول أربعة محلات مع زر لكل المحلات
export default function ShopsPreview() {
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
    <section className="shops-preview" dir="rtl">
      <div className="row-between">
        <h2 className="title">محلات الذهب</h2>
        <a href="/shops" className="btn-secondary">عرض كل المحلات</a>
      </div>

      <div className="grid">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </section>
  );
}
