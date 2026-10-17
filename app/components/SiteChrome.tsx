"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/app/lib/i18n";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// يلفّ كل الصفحات بالـHeader/Footer، ويضبط اتجاه ولغة المستند، ويخفي الـchrome في الأدمن.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang, dir } = useT();

  // مصدر الحقيقة لاتجاه/لغة الصفحة كلها
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  // الأدمن بلا chrome.
  if (pathname?.startsWith("/admin")) return <>{children}</>;

  // المجلة: يظهر الهيدر العام فوق هيدرها الخاص، بدون الفوتر العام
  // (المجلة تتحكّم بنهاية صفحتها: زر عائم + تنويه).
  if (pathname?.startsWith("/magazine")) {
    return (
      <>
        <SiteHeader />
        {children}
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
