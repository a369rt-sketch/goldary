import { supabase } from "@/app/lib/supabaseClient";

export type ShopKarat = "24K" | "22K" | "21K" | "18K";

// جدول shops
export type Shop = {
  id: string;
  name: string;
  province: string; // مفتاح المحافظة (baghdad, basra...) نفس provinces.ts
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  status?: string | null; // pending | approved | rejected | hidden
  owner_id?: string | null;
  karats?: string[] | null;
};

// جدول shop_prices
export type ShopPrice = {
  id: string;
  shop_id: string;
  karat: ShopKarat;
  price: number;
  updated_at: string;
};

// محل مع أسعاره (علاقة واحد-إلى-متعدّد)
export type ShopWithPrices = Shop & {
  prices: ShopPrice[];
};

// كل المحلات (العرض العام = المعتمدة فقط)
export async function getShops(): Promise<Shop[]> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Shops fetch failed:", error);
    return [];
  }

  return data ?? [];
}

// محلات محافظة معيّنة
export async function getShopsByProvince(province: string): Promise<Shop[]> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("province", province)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Shops fetch failed:", error);
    return [];
  }

  return data ?? [];
}

// كل المحلات مع أسعارها (استعلام واحد عبر ربط المفتاح الأجنبي)
export async function getShopsWithPrices(): Promise<ShopWithPrices[]> {
  const { data, error } = await supabase
    .from("shops")
    .select("*, shop_prices(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Shops fetch failed:", error);
    return [];
  }

  return (data ?? []).map((row: Shop & { shop_prices: ShopPrice[] }) => {
    const { shop_prices, ...shop } = row;
    return { ...shop, prices: shop_prices ?? [] };
  });
}

// أسعار محل واحد (صف لكل عيار)
export async function getShopPrices(shopId: string): Promise<ShopPrice[]> {
  const { data, error } = await supabase
    .from("shop_prices")
    .select("*")
    .eq("shop_id", shopId);

  if (error) {
    console.error("Shop prices fetch failed:", error);
    return [];
  }

  return data ?? [];
}

// محل واحد مع أسعاره عبر الربط بالمفتاح الأجنبي
export async function getShopWithPrices(
  shopId: string
): Promise<ShopWithPrices | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*, shop_prices(*)")
    .eq("id", shopId)
    .eq("status", "approved") // العرض العام: صفحة محل غير معتمد → 404
    .maybeSingle();

  if (error) {
    console.error("Shop fetch failed:", error);
    return null;
  }

  if (!data) return null;

  const { shop_prices, ...shop } = data as Shop & {
    shop_prices: ShopPrice[];
  };

  return { ...shop, prices: shop_prices ?? [] };
}

// محل معتمد عبر معرّف المالك (= shop_items.shop_id) — لصفحة المنتج المستقلة
export async function getApprovedShopByOwner(
  ownerId: string
): Promise<Shop | null> {
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "approved")
    .maybeSingle();
  return (data as Shop) ?? null;
}

// تحويل قائمة الأسعار إلى خريطة عيار → سعر للعرض السريع
export function pricesByKarat(
  prices: ShopPrice[]
): Record<ShopKarat, number | null> {
  const map: Record<ShopKarat, number | null> = {
    "24K": null,
    "22K": null,
    "21K": null,
    "18K": null,
  };

  for (const item of prices) {
    map[item.karat] = item.price;
  }

  return map;
}
