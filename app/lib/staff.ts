"use client";

import { supabase } from "@/app/lib/supabaseClient";

export type Staff = {
  id: string;
  shop_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
};

export type StaffInput = {
  name: string;
  role: string | null;
  phone: string | null;
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
