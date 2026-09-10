import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { type ShopItem } from "@/app/lib/shopItems";
import { getApprovedShopByOwner } from "@/app/lib/shops";
import ProductView from "./ProductView";

// جلب خادمي مباشر (shopItems.ts هو "use client" فلا يُستدعى من الخادم)
async function fetchPublishedItem(id: string): Promise<ShopItem | null> {
  const { data } = await supabase
    .from("shop_items")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return (data as ShopItem) ?? null;
}

// وصف مختصر للميتاداتا من حقول القطعة
function metaDescription(name: string, karat: string | null, weight: number | null, description: string | null) {
  if (description && description.trim()) return description.trim();
  const bits = [karat, weight != null ? `${weight} غ` : null].filter(Boolean).join(" · ");
  return bits ? `${name} — ${bits}` : name;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchPublishedItem(id);
  if (!item) return { title: "Goldary" };

  const title = item.name; // قالب الـlayout يضيف "| Goldary"
  const ogTitle = `${item.name} — Goldary`;
  const description = metaDescription(item.name, item.karat, item.weight, item.description);
  const images = item.image_url ? [item.image_url] : [];

  return {
    title,
    description,
    openGraph: { title: ogTitle, description, images, type: "website" },
    twitter: { card: "summary_large_image", title: ogTitle, description, images },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await fetchPublishedItem(id);
  if (!item) notFound();

  // المحل صاحب القطعة (معتمد فقط) — يوفّر الاسم والتواصل والربط
  const shop = await getApprovedShopByOwner(item.shop_id);
  if (!shop) notFound();

  return <ProductView item={item} shop={shop} />;
}
