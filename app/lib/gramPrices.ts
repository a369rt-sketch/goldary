import { supabase } from "@/app/lib/supabaseClient";

// جدول gram_prices — أسعار الغرام الميدانية المُدخلة يدوياً (عيار 21 فقط حالياً)
// آخر صف = السعر الحالي، نفس نمط جدول dollar_rate.
export type GramPrice = {
  id: string;
  karat: string;
  buy_gram_iqd: number; // سعر شراء الغرام (المحل يشتري من الزبون)
  sell_gram_iqd: number; // سعر بيع الغرام (المحل يبيع)
  usd_to_iqd: number; // الدولار وقت الإدخال (لتتبّع اشتقاق النمرة)
  numra: number; // النمرة المشتقة والمخزّنة (للتحليل، لا تدخل بحساب السعر)
  recorded_at: string;
};

// آخر صف مُدخل = السعر المعتمد الحالي
export async function getLatestGramPrice(): Promise<GramPrice | null> {
  const { data, error } = await supabase
    .from("gram_prices")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Gram price fetch failed:", error);
    return null;
  }

  return (data as GramPrice) ?? null;
}
