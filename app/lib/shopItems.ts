"use client";

import { supabase } from "@/app/lib/supabaseClient";

export type ShopItemStatus = "draft" | "published" | "sold";
export const ITEM_KARATS = ["24K", "22K", "21K", "18K"] as const;

export type ShopItem = {
  id: string;
  shop_id: string;
  name: string;
  image_url: string | null;
  weight: number | null;
  karat: string | null;
  price: number | null;
  status: ShopItemStatus;
  created_at: string;
  updated_at: string;
};

export type ItemInput = {
  name: string;
  image_url: string | null;
  weight: number | null;
  karat: string | null;
  price: number | null;
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
  return supabase
    .from("shop_items")
    .insert({ shop_id: shopUserId, ...input, status: "draft" });
}

export async function updateItem(id: string, input: Partial<ItemInput>) {
  return supabase
    .from("shop_items")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function setItemStatus(id: string, status: ShopItemStatus) {
  return supabase
    .from("shop_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteItem(id: string) {
  return supabase.from("shop_items").delete().eq("id", id);
}

// رفع صورة قطعة إلى bucket shop-images (عام)
export async function uploadItemImage(
  file: File,
  shopUserId: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `items/${shopUserId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("shop-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.error("Item image upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("shop-images").getPublicUrl(path);
  return data.publicUrl;
}
