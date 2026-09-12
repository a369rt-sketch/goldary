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
  ounce_usd: number | null; // سعر الأونصة العالمي وقت التسجيل
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

// تاريخ الأسعار (تصاعدي) — للوحات السوق. days=0 → كل السجلّ.
export async function getGramHistory(days = 0): Promise<GramPrice[]> {
  let q = supabase.from("gram_prices").select("*").order("recorded_at", { ascending: true });
  if (days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    q = q.gte("recorded_at", since);
  }
  const { data, error } = await q;
  if (error) {
    console.error("Gram history fetch failed:", error);
    return [];
  }
  return (data as GramPrice[]) ?? [];
}
