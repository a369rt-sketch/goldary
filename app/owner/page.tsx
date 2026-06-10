"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function OwnerHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        router.replace("/owner/login");
        return;
      }

      setEmail(data.user.email ?? null);
      setLoading(false);
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/owner/login");
  }

  if (loading) {
    return (
      <main className="container" dir="rtl">
        <p className="muted">جارٍ التحميل…</p>
      </main>
    );
  }

  return (
    <main className="container" dir="rtl">
      <h1 className="title">لوحة صاحب المحل</h1>
      <p className="lead muted">مرحباً، أنت مسجّل الدخول.</p>

      <div className="card" style={{ maxWidth: 420 }}>
        <div className="label">البريد الإلكتروني</div>
        <div dir="ltr" style={{ marginBottom: 14 }}>{email}</div>

        <button type="button" className="btn-secondary" onClick={logout}>
          تسجيل الخروج
        </button>
      </div>

      <p className="muted small" style={{ marginTop: 16 }}>
        إدارة المحل والأسعار قريباً.
      </p>
    </main>
  );
}
