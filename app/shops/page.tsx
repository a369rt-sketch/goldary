"use client";

import { useEffect, useMemo, useState } from "react";
import { getShopsWithPrices, type ShopWithPrices } from "@/app/lib/shops";
import { provinces } from "@/app/lib/provinces";
import ShopCard from "@/app/components/ShopCard";
import { useT } from "@/app/lib/i18n";

export default function ShopsPage() {
  const { t } = useT();
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
    <main className="container">
      <div className="row-between">
        <h1 className="title">{t.shops_heading}</h1>
        <a href="/" className="btn-secondary">{t.back}</a>
      </div>

      <p className="lead muted">{t.shops_subtitle}</p>

      <div className="row" style={{ marginTop: 8 }}>
        <input
          className="input"
          type="text"
          placeholder={t.search_shop}
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
          <option value="all">{t.all_provinces}</option>
          {provinces.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 22 }}>{t.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ marginTop: 22 }}>{t.no_shops}</p>
      ) : (
        <div className="grid">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </main>
  );
}
