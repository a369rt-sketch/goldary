"use client";

import { supabase } from "@/app/lib/supabaseClient";

export type GoalType = "marriage" | "house" | "travel" | "emergency" | "study";

export type AurumGoal = {
  id: string;
  user_id: string;
  goal_name: string;
  goal_type: GoalType | null;
  target_amount: number;
  monthly_saving: number | null;
  duration_months: number | null;
  current_amount: number;
  status: string;
  created_at: string;
};

export type AurumTransaction = {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  notes: string | null;
};

// أنواع الأهداف — المفتاح يُخزَّن، والعرض عربي مع أيقونة
export const GOAL_TYPES: { key: GoalType; label: string; icon: string }[] = [
  { key: "marriage", label: "زواج", icon: "💍" },
  { key: "house", label: "بيت", icon: "🏠" },
  { key: "travel", label: "سفر", icon: "✈️" },
  { key: "emergency", label: "طوارئ", icon: "🛟" },
  { key: "study", label: "دراسة", icon: "🎓" },
];

export const goalTypeMeta = (key: GoalType | null) =>
  GOAL_TYPES.find((g) => g.key === key) ?? { key: "marriage", label: "هدف", icon: "🎯" };

// تنسيق الدينار
export const fmtIqd = (n: number) =>
  `${Math.round(n).toLocaleString("en-US")} د.ع`;

export type GramPoint = { date: string; sell: number };

// تاريخ سعر بيع الغرام (21) — لأرخص يوم والمقارنة (قراءة عامة عبر anon + RLS)
export async function getGramHistory(limit = 120): Promise<GramPoint[]> {
  const { data, error } = await supabase
    .from("gram_prices")
    .select("sell_gram_iqd, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data
    .map((r: { sell_gram_iqd: number; recorded_at: string }) => ({
      date: r.recorded_at,
      sell: Number(r.sell_gram_iqd) || 0,
    }))
    .filter((p: GramPoint) => p.sell > 0);
}

// أرخص يوم شراء ضمن التاريخ المتاح
export function cheapestDay(history: GramPoint[]): GramPoint | null {
  if (!history.length) return null;
  return history.reduce((min, p) => (p.sell < min.sell ? p : min), history[0]);
}
