"use client";

import { supabase } from "@/app/lib/supabaseClient";

// صلاحيات أقسام لوحة المحل للموظف
export const STAFF_PERMISSIONS = ["invoices", "inventory", "reports"] as const;
export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];
export const PERMISSION_LABEL: Record<StaffPermission, string> = {
  invoices: "الفواتير",
  inventory: "المخزون",
  reports: "التقارير",
};

export type Staff = {
  id: string;
  shop_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  permissions: string[];
  active: boolean;
  created_at: string;
};

export type StaffInput = {
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  permissions: string[];
};

export async function getStaff(shopUserId: string): Promise<Staff[]> {
  const { data } = await supabase
    .from("shop_staff")
    .select("*")
    .eq("shop_id", shopUserId)
    .order("created_at", { ascending: true });
  return (data as Staff[]) ?? [];
}

export async function createStaff(shopUserId: string, input: StaffInput) {
  return supabase.from("shop_staff").insert({ shop_id: shopUserId, ...input });
}

export async function updateStaff(id: string, input: Partial<StaffInput & { active: boolean }>) {
  return supabase.from("shop_staff").update(input).eq("id", id);
}

export async function deleteStaff(id: string) {
  return supabase.from("shop_staff").delete().eq("id", id);
}

// سياق الموظف الحالي: المحل الذي يعمل به (إن وُجد) وصلاحياته — عبر مطابقة بريده.
export type StaffContext = { shopId: string; permissions: string[] };
export async function getMyStaffContext(): Promise<StaffContext | null> {
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email;
  if (!email) return null;
  const { data } = await supabase
    .from("shop_staff")
    .select("shop_id, permissions")
    .ilike("email", email)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { shopId: data.shop_id as string, permissions: (data.permissions as string[]) ?? [] };
}
