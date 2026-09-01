"use client";

import { supabase } from "@/app/lib/supabaseClient";
import { authFetch } from "@/app/lib/useAuth";
import { compressImage } from "@/app/lib/imageCompress";

export type ShopItemStatus = "draft" | "published" | "sold";
export const ITEM_KARATS = ["24K", "22K", "21K", "18K"] as const;

export type ShopItem = {
  id: string;
  shop_id: string;
  image_url: string | null; // الغلاف (= أول صورة) — للتوافق مع شاشات العرض
  image_urls: string[] | null; // كل صور القطعة
  name: string;
  description: string | null;
  tags: string[] | null;
  weight: number | null;
  karat: string | null;
  price: number | null;
  status: ShopItemStatus;
  created_at: string;
  updated_at: string;
};

export type ItemInput = {
  name: string;
  image_urls: string[]; // أول عنصر = الغلاف
  weight: number | null;
  karat: string | null;
  description: string | null;
  tags: string[];
};

// قطع الصائغ نفسه (كل الحالات) — نفلتر بالـshop_id لأن سياسة "public" تُظهر منشورات الآخرين أيضاً
export async function getMyItems(shopUserId: string): Promise<ShopItem[]> {
  const { data } = await supabase
    .from("shop_items")
    .select("*")
    .eq("shop_id", shopUserId)
    .order("created_at", { ascending: false });
  return (data as ShopItem[]) ?? [];
}

// كل القطع المنشورة (عبر كل المحلات) — للاقتراحات العامة (anon مسموح)
export async function getAllPublishedItems(limit = 30): Promise<ShopItem[]> {
  const { data } = await supabase
    .from("shop_items")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ShopItem[]) ?? [];
}

// القطع المنشورة لمحل معيّن (عرض عام) — anon مسموح عبر سياسة public
export async function getPublishedByShop(shopUserId: string): Promise<ShopItem[]> {
  const { data } = await supabase
    .from("shop_items")
    .select("*")
    .eq("shop_id", shopUserId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return (data as ShopItem[]) ?? [];
}

export async function createItem(shopUserId: string, input: ItemInput) {
  return supabase.from("shop_items").insert({
    shop_id: shopUserId,
    ...input,
    image_url: input.image_urls[0] ?? null, // الغلاف
    status: "draft",
  });
}

export async function updateItem(id: string, input: Partial<ItemInput>) {
  const patch: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  // مزامنة الغلاف عند تغيّر الصور
  if (input.image_urls) patch.image_url = input.image_urls[0] ?? null;
  return supabase.from("shop_items").update(patch).eq("id", id);
}

export async function setItemStatus(id: string, status: ShopItemStatus) {
  return supabase
    .from("shop_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// نشر/إلغاء نشر عبر API routes (service role + تحقّق ملكية)
export async function publishItem(id: string) {
  return authFetch(`/api/shop-items/${id}/publish`, { method: "POST" });
}
export async function unpublishItem(id: string) {
  return authFetch(`/api/shop-items/${id}/unpublish`, { method: "POST" });
}

export async function deleteItem(id: string) {
  return supabase.from("shop_items").delete().eq("id", id);
}

// رفع صورة قطعة عبر API route (service role) — يتجاوز خطأ Storage RLS 403 على رفع العميل.
export async function uploadItemImage(file: File): Promise<string | null> {
  const compressed = await compressImage(file); // تصغير/ضغط قبل الرفع
  const form = new FormData();
  form.append("file", compressed);
  try {
    const res = await authFetch("/api/shop-items/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    return res.ok && data.url ? (data.url as string) : null;
  } catch (e) {
    console.error("Item image upload failed:", e);
    return null;
  }
}
