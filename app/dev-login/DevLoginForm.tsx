"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { getProfile, dashboardHref } from "@/app/lib/profile";

// نموذج دخول تطويري بكلمة مرور (بلا OTP) — لاختبار اللوحات محلياً.
// لا يظهر في الإنتاج (الصفحة الخادمة تعيد 404).
export default function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    const profile = await getProfile();
    router.push(dashboardHref(profile?.account_type));
  }

  return (
    <main className="container" dir="rtl" style={{ maxWidth: 440 }}>
      <div
        className="card"
        style={{ border: "1px solid rgba(215,180,90,0.35)" }}
      >
        <div className="card-title" style={{ color: "#ffcc4a" }}>
          🔧 دخول تطويري (Dev only)
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>
          دخول بكلمة مرور لاختبار اللوحات محلياً — غير متاح في الإنتاج.
        </p>

        <form onSubmit={signIn} style={{ marginTop: 14 }}>
          <label className="label" htmlFor="dev-email">البريد الإلكتروني</label>
          <input
            id="dev-email"
            className="input"
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />

          <label className="label" htmlFor="dev-pass" style={{ marginTop: 12 }}>
            كلمة المرور
          </label>
          <input
            id="dev-pass"
            className="input"
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />

          {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 16, width: "100%" }}
          >
            {loading ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
