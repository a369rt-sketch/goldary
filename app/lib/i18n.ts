"use client";

import { useLang, type Lang } from "./language";

// قاموس الترجمة — الاسم "Goldary" يبقى ثابتاً في اللغتين ولا يُترجَم.
const DICT = {
  ar: {
    // Header / Footer
    nav_prices: "الأسعار الحالية",
    nav_magazine: "المجلة",
    nav_shops: "المحلات",
    login: "دخول",
    dashboard: "لوحة التحكم",
    logout: "تسجيل الخروج",
    currency: "العملة",
    language: "اللغة",
    quick_links: "روابط سريعة",
    about_app: "عن التطبيق",
    footer_desc:
      "منصتك الموثوقة لفهم الذهب والسوق، محليًا وعالميًا — أسعار لحظية، تحليلات، ودليل محلات الصاغة.",
    footer_about:
      "Goldary منصّة عراقية لمتابعة أسعار الذهب لحظة بلحظة عيار 21 ومثقال، مع مجلة متخصّصة ودليل للصاغة.",
    rights: "© 2026 Goldary. جميع الحقوق محفوظة.",
    curated_by: "Curated by Alaa Raheem",

    // Hero
    hero_tagline: "منصتك الموثوقة لفهم الذهب والسوق، محليًا وعالميًا",

    // Home
    currency_label: "العملة:",

    // GoldTicker
    live: "مباشر",
    updated: "آخر تحديث",
    buy21k: "شراء 21K",
    sell21k: "بيع 21K",
    loading: "جارٍ التحميل…",
    iqd_suffix: "د.ع",

    // ShopsPreview / ShopCard
    shops_heading: "محلات الذهب",
    view_all_shops: "عرض كل المحلات",
    shop_no_prices: "لا توجد أسعار بعد",
    shop_not_available: "غير متوفر",
    view_shop: "عرض المحل",

    // PublicInsights
    pi_heading: "إحصاءات السوق",
    pi_sub: "مؤشرات الذهب الحية في العراق",
    pi_live: "مباشر",
    pi_offline: "غير محدّث",
    pi_nodata: "لا توجد بيانات بعد",
    pi_ounce: "الأونصة العالمية (XAU/USD)",
    pi_ounce_price: "سعر الأونصة",
    pi_no_price: "لا يوجد سعر بعد",
    pi_last_update: "آخر تحديث",
    pi_trend: "اتجاه السوق",
    pi_trend_sub: "مقارنة آخر 30 يوم",
    pi_top_karat: "العيار الأكثر طلباً",
    pi_top_karat_sub: "حسب حسابات الزوار",
    pi_chart: "حركة السعر",
    pi_no_chart: "لا توجد بيانات كافية لعرض المنحنى بعد",
    pi_provinces: "ترتيب المحافظات",
  },
  en: {
    nav_prices: "Live Prices",
    nav_magazine: "Magazine",
    nav_shops: "Shops",
    login: "Log in",
    dashboard: "Dashboard",
    logout: "Log out",
    currency: "Currency",
    language: "Language",
    quick_links: "Quick Links",
    about_app: "About",
    footer_desc:
      "Your trusted platform to understand gold and the market, locally and globally — live prices, analysis, and a jewelers directory.",
    footer_about:
      "Goldary is an Iraqi platform for real-time 21K gold and mithqal prices, with a dedicated magazine and a jewelers directory.",
    rights: "© 2026 Goldary. All rights reserved.",
    curated_by: "Curated by Alaa Raheem",

    hero_tagline:
      "Your trusted platform to understand gold and the market, locally and globally",

    currency_label: "Currency:",

    live: "LIVE",
    updated: "Updated",
    buy21k: "Buy 21K",
    sell21k: "Sell 21K",
    loading: "Loading…",
    iqd_suffix: "IQD",

    shops_heading: "Gold Shops",
    view_all_shops: "View all shops",
    shop_no_prices: "No prices yet",
    shop_not_available: "Not available",
    view_shop: "View shop",

    pi_heading: "Market Insights",
    pi_sub: "Live gold indicators in Iraq",
    pi_live: "Live",
    pi_offline: "Not updated",
    pi_nodata: "No data yet",
    pi_ounce: "Global Ounce (XAU/USD)",
    pi_ounce_price: "Ounce price",
    pi_no_price: "No price yet",
    pi_last_update: "Last update",
    pi_trend: "Market Trend",
    pi_trend_sub: "Compared to last 30 days",
    pi_top_karat: "Most Requested Karat",
    pi_top_karat_sub: "Based on visitor calculations",
    pi_chart: "Price Movement",
    pi_no_chart: "Not enough data to draw the chart yet",
    pi_provinces: "Governorates Ranking",
  },
} as const;

export type TKey = keyof (typeof DICT)["ar"];

// وقت نسبي حسب اللغة: "قبل X دقيقة" / "X min ago"
export function relativeTime(iso: string | null, now: number, lang: Lang): string {
  if (!iso) return lang === "ar" ? "—" : "—";
  const diffMs = now - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (lang === "ar") {
    if (min < 1) return "قبل لحظات";
    if (min < 60) return `قبل ${min} دقيقة`;
    if (hr < 24) return `قبل ${hr} ساعة`;
    return `قبل ${day} يوم`;
  }
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

// hook مركزي: يعيد الترجمة واللغة والاتجاه ودالة التبديل.
export function useT() {
  const [lang, setLang] = useLang();
  return {
    t: DICT[lang],
    lang,
    setLang,
    dir: lang === "ar" ? ("rtl" as const) : ("ltr" as const),
  };
}
