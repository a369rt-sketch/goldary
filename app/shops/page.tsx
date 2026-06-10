"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getShopsWithPrices,
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

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await getShopsWithPrices();
      if (!mounted) return;
      setShops(data);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesSearch = !q || shop.name.toLowerCase().includes(q);
      const matchesProvince = province === "all" || shop.province === province;
      return matchesSearch && matchesProvince;
    });
  }, [shops, search, province]);

  return (
    <main className="container" dir="rtl">
      <div className="row-between">
        <h1 className="title">محلات الذهب</h1>
        <a href="/" className="btn-secondary">رجوع</a>
      </div>

      <p className="lead muted">
        اكتشف محلات الذهب المعتمدة في العراق وأسعارها اليومية
      </p>

      <div className="row" style={{ marginTop: 8 }}>
        <input
          className="input"
          type="text"
          placeholder="ابحث عن محل"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />

        <select
          className="input"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="all">كل المحافظات</option>
          {provinces.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 22 }}>جارٍ التحميل…</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ marginTop: 22 }}>لا توجد محلات مطابقة</p>
      ) : (
        <div className="grid">
          {filtered.map((shop) => {
            const map = pricesByKarat(shop.prices);

            return (
              <div key={shop.id} className="card">
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
          })}
        </div>
      )}
    </main>
  );
}
