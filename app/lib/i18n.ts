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

    // Magazine
    mag_title: "مجلة Goldary",
    mag_subtitle: "أخبار وتحليلات الذهب والسوق في العراق",
    my_articles: "مقالاتي",
    home: "الرئيسية",
    back: "رجوع",
    tab_all: "الكل",
    mag_empty: "لا توجد مقالات في هذا القسم بعد",
    back_to_magazine: "← المجلة",
    share: "مشاركة",
    share_copied: "تم نسخ الرابط ✓",
    snapshot_label: "سعر 21K وقت النشر:",
    published_on: "نُشر في",
    affects_prefix: "يؤثر على:",

    // Shops
    shops_subtitle: "اكتشف محلات الذهب المعتمدة في العراق وأسعارها اليومية",
    search_shop: "ابحث عن محل",
    all_provinces: "كل المحافظات",
    no_shops: "لا توجد محلات مطابقة",
    back_to_shops: "رجوع للمحلات",
    prices_today: "الأسعار اليوم",
    gallery: "معرض الصور",
    call: "اتصال",
    whatsapp: "واتساب",
    close: "إغلاق",
    prev: "السابق",
    next: "التالي",

    // أقسام المجلة و"يؤثر على"
    categories: {
      news: "أخبار",
      analysis: "تحليل السوق",
      learn: "تعلم الذهب",
      investment: "الاستثمار",
      markets: "أسواق ومحلات",
    },
    affects: { local: "محلي", global: "عالمي", dollar: "دولار" },

    // محرّر المقالات + مقالاتي
    new_article: "✍️ اكتب مقال جديد",
    manage_articles: "إدارة المقالات — مسودات ومنشورة",
    no_articles_yet: "لا توجد مقالات بعد",
    st_published: "منشور",
    st_draft: "مسودة",
    edit: "تعديل",
    delete: "حذف",
    confirm_delete: 'حذف المقال "{title}"؟ لا يمكن التراجع.',
    delete_failed: "فشل حذف المقال",
    delete_error: "خطأ في الحذف",
    form_new: "مقال جديد",
    form_edit: "تعديل المقال",
    f_title: "العنوان",
    f_title_ph: "اكتب عنوان المقال",
    f_slug: "الرابط (Slug)",
    f_cover: "صورة المقال",
    f_upload: "انقر لرفع صورة",
    f_category: "الفئة",
    f_excerpt: "الملخص",
    f_excerpt_ph: "ملخص قصير للمقال",
    f_content: "المحتوى (Markdown)",
    f_content_ph: "اكتب محتوى المقال هنا... يمكنك استخدام Markdown للتنسيق",
    f_img_hint: "للصور استخدم: ![alt](url)",
    f_publish_now: "نشر المقال الآن",
    f_published: "منشور",
    m_img_ok: "تم رفع الصورة بنجاح ✓",
    m_img_fail: "فشل رفع الصورة",
    m_img_err: "خطأ في رفع الصورة",
    m_updated: "تم تحديث المقال ✓",
    m_published: "تم نشر المقال ✓",
    m_draft_saved: "تم حفظ المسودة ✓",
    m_save_fail: "فشل حفظ المقال",
    m_save_err: "خطأ في الحفظ",
    b_saving: "جاري الحفظ...",
    b_save_edits: "حفظ التعديلات",
    b_publish: "نشر المقال",
    b_save_draft: "حفظ كمسودة",

    // صفحة دخول الصاغة (OTP)
    login_title: "تسجيل دخول أصحاب المحلات",
    login_lead_email: "أدخل بريدك الإلكتروني وسنرسل لك رمز دخول",
    login_lead_code: "أدخل الرمز الذي وصلك على البريد",
    login_label_email: "البريد الإلكتروني",
    login_label_code: "رمز التحقق",
    login_err_email: "الرجاء إدخال بريد إلكتروني صالح",
    login_err_send: "تعذّر إرسال الرمز، حاول مرة أخرى",
    login_notice_sent: "أرسلنا رمزاً مكوّناً من 6 أرقام إلى بريدك",
    login_err_code_full: "الرجاء إدخال الرمز كاملاً",
    login_err_code_invalid: "الرمز غير صحيح أو منتهي الصلاحية",
    login_btn_sending: "جارٍ الإرسال…",
    login_btn_send: "إرسال الرمز",
    login_btn_verifying: "جارٍ التحقق…",
    login_btn_verify: "تأكيد وتسجيل الدخول",
    login_btn_change_email: "تغيير البريد",
    login_btn_resend: "إعادة إرسال الرمز",
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

    // Magazine
    mag_title: "Goldary Magazine",
    mag_subtitle: "Gold and market news & analysis in Iraq",
    my_articles: "My Articles",
    home: "Home",
    back: "Back",
    tab_all: "All",
    mag_empty: "No articles in this section yet",
    back_to_magazine: "← Magazine",
    share: "Share",
    share_copied: "Link copied ✓",
    snapshot_label: "21K price at publish:",
    published_on: "Published on",
    affects_prefix: "Affects:",

    // Shops
    shops_subtitle: "Discover verified gold shops in Iraq and their daily prices",
    search_shop: "Search for a shop",
    all_provinces: "All governorates",
    no_shops: "No matching shops",
    back_to_shops: "Back to shops",
    prices_today: "Today's Prices",
    gallery: "Gallery",
    call: "Call",
    whatsapp: "WhatsApp",
    close: "Close",
    prev: "Previous",
    next: "Next",

    categories: {
      news: "News",
      analysis: "Market Analysis",
      learn: "Gold Learning",
      investment: "Investment",
      markets: "Shops & Markets",
    },
    affects: { local: "Local", global: "Global", dollar: "Dollar" },

    // Article editor + My Articles
    new_article: "✍️ Write new article",
    manage_articles: "Manage articles — drafts and published",
    no_articles_yet: "No articles yet",
    st_published: "Published",
    st_draft: "Draft",
    edit: "Edit",
    delete: "Delete",
    confirm_delete: 'Delete article "{title}"? This cannot be undone.',
    delete_failed: "Failed to delete article",
    delete_error: "Error deleting",
    form_new: "New Article",
    form_edit: "Edit Article",
    f_title: "Title",
    f_title_ph: "Write the article title",
    f_slug: "Slug",
    f_cover: "Cover image",
    f_upload: "Click to upload an image",
    f_category: "Category",
    f_excerpt: "Excerpt",
    f_excerpt_ph: "A short summary of the article",
    f_content: "Content (Markdown)",
    f_content_ph: "Write the article content here... you can use Markdown for formatting",
    f_img_hint: "For images use: ![alt](url)",
    f_publish_now: "Publish now",
    f_published: "Published",
    m_img_ok: "Image uploaded ✓",
    m_img_fail: "Image upload failed",
    m_img_err: "Error uploading image",
    m_updated: "Article updated ✓",
    m_published: "Article published ✓",
    m_draft_saved: "Draft saved ✓",
    m_save_fail: "Failed to save article",
    m_save_err: "Error saving",
    b_saving: "Saving...",
    b_save_edits: "Save changes",
    b_publish: "Publish",
    b_save_draft: "Save as draft",

    // Owner login page (OTP)
    login_title: "Shop Owner Login",
    login_lead_email: "Enter your email and we'll send you a login code",
    login_lead_code: "Enter the code sent to your email",
    login_label_email: "Email",
    login_label_code: "Verification code",
    login_err_email: "Please enter a valid email",
    login_err_send: "Couldn't send the code, please try again",
    login_notice_sent: "We sent a 6-digit code to your email",
    login_err_code_full: "Please enter the full code",
    login_err_code_invalid: "Invalid or expired code",
    login_btn_sending: "Sending…",
    login_btn_send: "Send code",
    login_btn_verifying: "Verifying…",
    login_btn_verify: "Confirm & log in",
    login_btn_change_email: "Change email",
    login_btn_resend: "Resend code",
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
