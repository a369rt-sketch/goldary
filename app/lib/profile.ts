"use client";

import { supabase } from "@/app/lib/supabaseClient";

export type AccountType = "goldsmith" | "aurum";

export type Profile = {
  user_id: string;
  account_type: AccountType;
  name: string | null;
  email: string | null;
  phone: string | null;
  shop_name: string | null;
  location: string | null;
  created_at: string;
};

// ملف المستخدم الحالي (RLS يعيد ملفه فقط)
export async function getProfile(): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile) ?? null;
}

// وجهة اللوحة حسب نوع الحساب
export const dashboardHref = (type: AccountType | null | undefined): string =>
  type === "aurum" ? "/aurum" : "/dashboard";
