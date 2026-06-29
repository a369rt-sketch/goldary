"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// لوحة المالك الحقيقية موجودة في /dashboard — نعيد التوجيه إليها.
export default function OwnerHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="container" dir="rtl">
      <p className="muted">جارٍ التحويل…</p>
    </main>
  );
}
