import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service · شروط الاستخدام",
  description: "شروط استخدام منصة Goldary — Goldary Terms of Service.",
};

const SECTIONS: LegalSection[] = [
  {
    ar: {
      h: "قبول الشروط",
      p: [
        "باستخدامك منصة Goldary («المنصة») فإنك توافق على هذه الشروط. إذا كنت لا توافق، فيرجى عدم استخدام المنصة.",
      ],
    },
    en: {
      h: "Acceptance of Terms",
      p: [
        "By using the Goldary platform (the “Platform”) you agree to these Terms. If you do not agree, please do not use the Platform.",
      ],
    },
  },
  {
    ar: {
      h: "وصف الخدمة",
      p: [
        "Goldary منصّة عراقية توفّر: سوقاً لاكتشاف محلات الذهب ومنتجاتها، ومعلومات عن أسعار الذهب والسوق، وأدوات إدارة لأصحاب المحلات، وأداة Aurum للتخطيط الادّخاري التعليمي.",
        "قد نضيف أو نعدّل أو نوقف أي ميزة في أي وقت. بعض الميزات مجانية وأخرى قد تتطلب اشتراكاً مدفوعاً مستقبلاً.",
      ],
    },
    en: {
      h: "Service Description",
      p: [
        "Goldary is an Iraqi platform providing: a marketplace to discover gold shops and their products, gold price and market information, management tools for shop owners, and Aurum — an educational savings-planning tool.",
        "We may add, change, or discontinue any feature at any time. Some features are free; others may require a paid subscription in the future.",
      ],
    },
  },
  {
    ar: {
      h: "الحسابات",
      p: [
        "تلتزم بتقديم معلومات صحيحة وبالحفاظ على سرّية بيانات دخولك، وأنت مسؤول عن كل نشاط يجري عبر حسابك.",
        "حسابات المحلات تخضع لمراجعة واعتماد من إدارة Goldary قبل الظهور العام. يحقّ لنا رفض أو تعليق أي حساب يخالف هذه الشروط.",
      ],
    },
    en: {
      h: "Accounts",
      p: [
        "You agree to provide accurate information and to keep your credentials confidential; you are responsible for all activity under your account.",
        "Shop accounts are subject to review and approval by Goldary before appearing publicly. We may reject or suspend any account that violates these Terms.",
      ],
    },
  },
  {
    ar: {
      h: "مسؤوليات المحلات",
      p: [
        "أصحاب المحلات مسؤولون عن دقّة بياناتهم ومنتجاتهم وأسعارهم وصورهم، وعن مشروعية ما يعرضونه.",
        "الأسعار والمنتجات المعروضة إرشادية وقد تتغيّر؛ تُحسم التفاصيل النهائية مباشرةً بين المحل والزبون. Goldary ليست طرفاً في أي معاملة بيع أو شراء.",
      ],
    },
    en: {
      h: "Shop Responsibilities",
      p: [
        "Shop owners are responsible for the accuracy of their information, products, prices, and images, and for the legality of what they list.",
        "Displayed prices and products are indicative and may change; final details are settled directly between the shop and the customer. Goldary is not a party to any sale or purchase.",
      ],
    },
  },
  {
    ar: {
      h: "أسعار الذهب ومعلومات السوق",
      p: [
        "معلومات أسعار الذهب والسوق تُقدَّم لأغراض إعلامية وتعليمية فقط، وليست عرضاً للبيع أو الشراء ولا نصيحة مالية أو استثمارية.",
        "أسعار الذهب متقلّبة وتُشتقّ من مصادر خارجية قد تتأخّر أو تخطئ. لا تتحمّل Goldary مسؤولية أي قرار يُتّخذ بناءً على هذه المعلومات.",
      ],
    },
    en: {
      h: "Gold Prices & Market Information",
      p: [
        "Gold price and market information is provided for informational and educational purposes only; it is not an offer to buy or sell, nor financial or investment advice.",
        "Gold prices are volatile and derived from third-party sources that may be delayed or inaccurate. Goldary is not liable for any decision made based on this information.",
      ],
    },
  },
  {
    ar: {
      h: "أداة Aurum",
      p: [
        "Aurum أداة تخطيط وتعليم مالي فقط لمساعدتك على تنظيم الادّخار، وليست نصيحة استثمارية ولا ضماناً لأي عائد.",
      ],
    },
    en: {
      h: "Aurum Tool",
      p: [
        "Aurum is a financial planning and education tool to help you organize savings; it is not investment advice and does not guarantee any return.",
      ],
    },
  },
  {
    ar: {
      h: "الاستخدام المحظور",
      p: [
        "يُمنع استخدام المنصة لأي غرض غير قانوني، أو نشر بيانات مضلِّلة أو منتجات مزيّفة، أو انتحال هوية الغير، أو محاولة اختراق النظام أو الوصول غير المصرّح به لبيانات المستخدمين.",
      ],
    },
    en: {
      h: "Prohibited Use",
      p: [
        "You may not use the Platform for any unlawful purpose, post misleading data or counterfeit products, impersonate others, or attempt to breach the system or gain unauthorized access to user data.",
      ],
    },
  },
  {
    ar: {
      h: "الملكية الفكرية",
      p: [
        "اسم Goldary وشعارها وتصميمها ومحتوى المجلّة مملوكة للمنصّة. تبقى صور المحلات ومحتواها ملكاً لأصحابها، وتمنحنا ترخيصاً بعرضها ضمن المنصّة.",
      ],
    },
    en: {
      h: "Intellectual Property",
      p: [
        "The Goldary name, logo, design, and magazine content belong to the Platform. Shop images and content remain owned by their owners, who grant us a license to display them within the Platform.",
      ],
    },
  },
  {
    ar: {
      h: "إخلاء المسؤولية وحدودها",
      p: [
        "تُقدَّم المنصّة «كما هي» دون ضمانات. إلى الحدّ الذي يسمح به القانون، لا تتحمّل Goldary أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصّة أو التعامل مع المحلات.",
      ],
    },
    en: {
      h: "Disclaimer & Limitation of Liability",
      p: [
        "The Platform is provided “as is” without warranties. To the extent permitted by law, Goldary is not liable for any direct or indirect damages arising from use of the Platform or dealings with shops.",
      ],
    },
  },
  {
    ar: {
      h: "التعديلات على الشروط",
      p: [
        "قد نحدّث هذه الشروط من وقت لآخر. استمرارك في استخدام المنصّة بعد التحديث يعني قبولك للشروط المعدّلة.",
      ],
    },
    en: {
      h: "Changes to the Terms",
      p: [
        "We may update these Terms from time to time. Your continued use of the Platform after an update means you accept the revised Terms.",
      ],
    },
  },
  {
    ar: {
      h: "القانون الحاكم والتواصل",
      p: [
        "تخضع هذه الشروط لقوانين جمهورية العراق. لأي استفسار قانوني تواصلوا معنا عبر القنوات الرسمية المتاحة في المنصّة.",
      ],
    },
    en: {
      h: "Governing Law & Contact",
      p: [
        "These Terms are governed by the laws of the Republic of Iraq. For any legal inquiry, contact us through the official channels available on the Platform.",
      ],
    },
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      titleAr="شروط الاستخدام"
      titleEn="Terms of Service"
      updatedAr="آخر تحديث: سبتمبر 2026"
      updatedEn="Last updated: September 2026"
      introAr="تحكم هذه الشروط استخدامك لمنصّة Goldary. يُرجى قراءتها بعناية."
      introEn="These Terms govern your use of the Goldary platform. Please read them carefully."
      sections={SECTIONS}
    />
  );
}
