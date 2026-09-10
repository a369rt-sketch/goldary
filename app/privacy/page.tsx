import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · سياسة الخصوصية",
  description: "سياسة خصوصية منصة Goldary — Goldary Privacy Policy.",
};

const SECTIONS: LegalSection[] = [
  {
    ar: {
      h: "البيانات التي نجمعها",
      p: [
        "بيانات الحساب: البريد الإلكتروني، الاسم، رقم الهاتف/الواتساب، ونوع الحساب. ولأصحاب المحلات: اسم المحل والمحافظة والعنوان والشعار وصور المنتجات وأسعارها.",
        "بيانات الاستخدام: تفضيلات مثل اللغة والعملة (تُحفظ محلياً في متصفحك)، وإحصاءات مجهّلة عن استخدام أدوات الحساب لتحسين الخدمة.",
      ],
    },
    en: {
      h: "Data We Collect",
      p: [
        "Account data: email, name, phone/WhatsApp, and account type. For shop owners: shop name, province, address, logo, product images, and prices.",
        "Usage data: preferences such as language and currency (stored locally in your browser), and anonymized statistics about use of the calculation tools to improve the service.",
      ],
    },
  },
  {
    ar: {
      h: "كيف نستخدم بياناتك",
      p: [
        "لتشغيل حسابك وعرض محلّك أو منتجاتك، وتمكين الزبائن من التواصل معك، وتحسين المنصّة وتحليلها، والتواصل معك بخصوص الخدمة.",
      ],
    },
    en: {
      h: "How We Use Your Data",
      p: [
        "To operate your account and display your shop or products, enable customers to contact you, improve and analyze the Platform, and communicate with you about the service.",
      ],
    },
  },
  {
    ar: {
      h: "التخزين ومقدّمو الخدمة",
      p: [
        "تُخزَّن البيانات لدى Supabase (استضافة وقاعدة بيانات). نستخدم أيضاً مزوّدي أسعار ذهب خارجيين لجلب أسعار السوق. يعالج هؤلاء البيانات وفق سياساتهم.",
      ],
    },
    en: {
      h: "Storage & Processors",
      p: [
        "Data is stored with Supabase (hosting and database). We also use third-party gold-price providers to fetch market prices. These providers process data under their own policies.",
      ],
    },
  },
  {
    ar: {
      h: "مشاركة البيانات",
      p: [
        "لا نبيع بياناتك. تظهر معلومات المحل العامة (الاسم، المحافظة، التواصل، المنتجات) للجمهور بحكم طبيعة السوق. قد نكشف بيانات إذا فرض القانون ذلك.",
      ],
    },
    en: {
      h: "Data Sharing",
      p: [
        "We do not sell your data. A shop’s public information (name, province, contact, products) is shown publicly by the nature of the marketplace. We may disclose data if required by law.",
      ],
    },
  },
  {
    ar: {
      h: "ملفات تعريف الارتباط والتخزين المحلي",
      p: [
        "نستخدم التخزين المحلي في متصفحك لحفظ تفضيلات اللغة والعملة وجلسة الدخول. لا نستخدم إعلانات تتبّع.",
      ],
    },
    en: {
      h: "Cookies & Local Storage",
      p: [
        "We use your browser’s local storage to save language/currency preferences and your login session. We do not use tracking ads.",
      ],
    },
  },
  {
    ar: {
      h: "حقوقك",
      p: [
        "يمكنك الوصول إلى بياناتك أو تصحيحها من لوحة حسابك. لطلب حذف حسابك وبياناتك، تواصل معنا عبر القنوات الرسمية في المنصّة وسننفّذ الطلب وفق القانون.",
      ],
    },
    en: {
      h: "Your Rights",
      p: [
        "You can access or correct your data from your account dashboard. To request deletion of your account and data, contact us through the Platform’s official channels and we will act on it in accordance with the law.",
      ],
    },
  },
  {
    ar: {
      h: "الاحتفاظ بالبيانات",
      p: [
        "نحتفظ ببياناتك ما دام حسابك فعّالاً وبالقدر اللازم لتشغيل الخدمة والامتثال للالتزامات القانونية، ثم نحذفها أو نجعلها مجهّلة.",
      ],
    },
    en: {
      h: "Data Retention",
      p: [
        "We retain your data while your account is active and as needed to operate the service and meet legal obligations, after which we delete or anonymize it.",
      ],
    },
  },
  {
    ar: {
      h: "الأمان",
      p: [
        "نطبّق ضوابط وصول على مستوى الصفوف (RLS) ونحفظ المفاتيح الحسّاسة على الخادم فقط. لا يوجد نظام آمن بنسبة 100%، لكننا نسعى لحماية بياناتك بجدّية.",
      ],
    },
    en: {
      h: "Security",
      p: [
        "We apply row-level access controls (RLS) and keep sensitive keys server-side only. No system is 100% secure, but we take protecting your data seriously.",
      ],
    },
  },
  {
    ar: {
      h: "خصوصية الأطفال",
      p: [
        "المنصّة غير موجّهة لمن هم دون 18 عاماً، ولا نجمع بياناتهم عن قصد.",
      ],
    },
    en: {
      h: "Children’s Privacy",
      p: [
        "The Platform is not directed to anyone under 18, and we do not knowingly collect their data.",
      ],
    },
  },
  {
    ar: {
      h: "التعديلات والتواصل",
      p: [
        "قد نحدّث هذه السياسة من وقت لآخر وننشر النسخة المحدّثة هنا. لأي استفسار عن الخصوصية، تواصل معنا عبر القنوات الرسمية في المنصّة.",
      ],
    },
    en: {
      h: "Changes & Contact",
      p: [
        "We may update this policy from time to time and post the updated version here. For any privacy inquiry, contact us through the Platform’s official channels.",
      ],
    },
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      titleAr="سياسة الخصوصية"
      titleEn="Privacy Policy"
      updatedAr="آخر تحديث: سبتمبر 2026"
      updatedEn="Last updated: September 2026"
      introAr="توضّح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها في منصّة Goldary."
      introEn="This policy explains how we collect, use, and protect your data on the Goldary platform."
      sections={SECTIONS}
    />
  );
}
