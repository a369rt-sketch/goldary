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

const OUNCE_TO_GRAM = 31.1035;

const KARAT_FACTOR = {
  "24K": 1,
  "22K": 0.9167,
  "21K": 0.875,
} as const;

export function getBaseUsd(data: GoldData | null | undefined) {
  const usd24 =
    Number(data?.price_gram_24k ?? data?.usd24 ?? 0);

  const usd22 =
    Number(data?.price_gram_22k ?? data?.usd22 ?? 0);

  const usd21 =
    Number(data?.price_gram_21k ?? data?.usd21 ?? 0);

  // إذا GoldAPI رجع أسعار الغرام مباشرة
  if (usd24 || usd22 || usd21) {
    return { usd24, usd22, usd21 };
  }

  // fallback إذا عندنا فقط سعر الأونصة
  const ounceUsd = Number(data?.ounceUsd ?? 0);
  if (!ounceUsd) {
    return { usd24: 0, usd22: 0, usd21: 0 };
  }

  const usdPerGram24 = ounceUsd / OUNCE_TO_GRAM;

  return {
    usd24: Number((usdPerGram24 * KARAT_FACTOR["24K"]).toFixed(2)),
    usd22: Number((usdPerGram24 * KARAT_FACTOR["22K"]).toFixed(2)),
    usd21: Number((usdPerGram24 * KARAT_FACTOR["21K"]).toFixed(2)),
  };
}

export function getBaseIqd(data: GoldData | null | undefined) {
  const usdToIqd = Number(data?.usdToIqd ?? 0);
  const usd = getBaseUsd(data);

  if (!usdToIqd) {
    return {
      iqd24: 0,
      iqd22: 0,
      iqd21: 0,
    };
  }

  return {
    iqd24: Math.round(usd.usd24 * usdToIqd),
    iqd22: Math.round(usd.usd22 * usdToIqd),
    iqd21: Math.round(usd.usd21 * usdToIqd),
  };
}

export function buildLocalSellBuy(baseIqd: {
  iqd24: number;
  iqd22: number;
  iqd21: number;
}) {
  const buy = {
    iqd24: Math.round(baseIqd.iqd24 * 0.97),
    iqd22: Math.round(baseIqd.iqd22 * 0.97),
    iqd21: Math.round(baseIqd.iqd21 * 0.97),
  };

  const sellNew = {
    iqd24: Math.round(baseIqd.iqd24 * 1.03),
    iqd22: Math.round(baseIqd.iqd22 * 1.03),
    iqd21: Math.round(baseIqd.iqd21 * 1.03),
  };

  const sellUsed = {
    iqd24: Math.round(baseIqd.iqd24 * 1.01),
    iqd22: Math.round(baseIqd.iqd22 * 1.01),
    iqd21: Math.round(baseIqd.iqd21 * 1.01),
  };

  return { buy, sellNew, sellUsed };
}

export function fmt(value: number, currency: Currency) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "--";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "IQD" ? "IQD" : "USD",
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(n);
}