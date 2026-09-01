"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/app/lib/i18n";
import { getShops } from "@/app/lib/shops";
import { getAllPublishedItems, type ShopItem } from "@/app/lib/shopItems";
import PieceCard from "@/app/components/PieceCard";

type ShopRef = { id: string; name: string };

// المعرض العام — كل القطع المنشورة عبر جميع المحلات، مع بحث بالوسوم/الاسم.
export default function CollectionPage() {
  const { t, dir } = useT();
  const [items, setItems] = useState<ShopItem[]>([]);
  // خريطة: shop_id (= معرّف مالك المحل) → المحل، لعرض اسمه والربط به
  const [shopByOwner, setShopByOwner] = useState<Record<string, ShopRef>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getAllPublishedItems(500), getShops()]).then(([its, shops]) => {
      if (!alive) return;
      const map: Record<string, ShopRef> = {};
      for (const s of shops as Array<{ id: string; name: string; owner_id?: string | null }>) {
        if (s.owner_id) map[s.owner_id] = { id: s.id, name: s.name };
      }
      setShopByOwner(map);
      setItems(its);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const inName = it.name.toLowerCase().includes(q);
      const inTags = (it.tags ?? []).some((tg) => tg.toLowerCase().includes(q));
      const inDesc = (it.description ?? "").toLowerCase().includes(q);
      return inName || inTags || inDesc;
    });
  }, [items, query]);

  const countLabel = `${filtered.length} ${
    filtered.length === 1 ? t.col_count_one : t.col_count_many
  }`;

  return (
    <main className="container" dir={dir}>
      <div className="row-between">
        <h1 className="title">{t.col_title}</h1>
        <a href="/shops" className="btn-secondary">{t.nav_shops}</a>
      </div>
      <p className="muted" style={{ marginTop: -6 }}>{t.col_subtitle}</p>

      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.col_search_ph}
        style={{ width: "100%", margin: "14px 0" }}
      />

      {loading ? (
        <p className="muted">{t.loading}</p>
      ) : items.length === 0 ? (
        <p className="muted">{t.col_none}</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{t.col_empty}</p>
      ) : (
        <>
          <p className="muted small" style={{ marginBottom: 10 }}>{countLabel}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((it) => {
              const shop = shopByOwner[it.shop_id];
              return (
                <PieceCard
                  key={it.id}
                  it={it}
                  shopName={shop?.name}
                  shopHref={shop ? `/shops/${shop.id}` : undefined}
                />
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
