"use client";

import { useState } from "react";

type Props = {
  title: string;
};

// زر مشاركة — Web Share API إن توفّر، وإلا نسخ الرابط
export default function ShareButton({ title }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    // navigator.share غير متوفّر بكل المتصفحات
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, url });
        return;
      } catch {
        // أُلغيت المشاركة — نتجاهل
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* لا شيء */
    }
  }

  return (
    <button type="button" className="btn-secondary small-btn" onClick={share}>
      {copied ? "تم نسخ الرابط ✓" : "مشاركة"}
    </button>
  );
}
