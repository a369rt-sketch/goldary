export type Currency = "USD" | "IQD";
export type Condition = "new" | "used";

export type GoldData = {
  // إذا API رجع أسعار الغرام مباشرة
  price_gram_24k?: number;
  price_gram_22k?: number;
  price_gram_21k?: number;

  // أو إذا رجعها بأسماء ثانية
  usd24?: number;
  usd22?: number;
  usd21?: number;

  // إذا احتجنا fallback من الأونصة
  ounceUsd?: number;

  // تحويل الدولار للدينار
  usdToIqd?: number;

  updatedAt?: string;
  source?: string;
};

export function fmt(value: number, currency: Currency) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "--";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "IQD" ? "IQD" : "USD",
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(n);
}