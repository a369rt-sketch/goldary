"use client";

import { authFetch } from "@/app/lib/useAuth";

export type Plan = "free" | "pro";
export const PLAN_LABEL: Record<Plan, string> = {
  free: "مجاني",
  pro: "احترافي (Pro)",
};

// هل المحل مشترك Pro وفعّال؟ (لا انتهاء = دائم)
export function isPro(shop: { plan?: string | null; plan_expires_at?: string | null } | null | undefined): boolean {
  if (!shop || shop.plan !== "pro") return false;
  if (!shop.plan_expires_at) return true;
  return new Date(shop.plan_expires_at).getTime() > Date.now();
}

// تفعيل/إلغاء الخطة عبر مسار الأدمن (service role) — action: شهر/سنة/مجاني
export async function setShopPlan(shopId: string, action: "month" | "year" | "free") {
  return authFetch(`/api/admin/shops/${shopId}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}
