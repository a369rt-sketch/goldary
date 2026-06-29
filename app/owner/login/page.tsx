"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

type Step = "email" | "code";

export default function OwnerLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // الخطوة 1: إرسال رمز OTP للإيميل
  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setNotice("");

    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("الرجاء إدخال بريد إلكتروني صالح");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (error) {
      setError("تعذّر إرسال الرمز، حاول مرة أخرى");
      return;
    }

    setStep("code");
    setNotice("أرسلنا رمزاً مكوّناً من 6 أرقام إلى بريدك");
  }

  // الخطوة 2: التحقق من الرمز وتسجيل الدخول
  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    const token = code.trim();
    if (token.length < 6) {
      setError("الرجاء إدخال الرمز كاملاً");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    setLoading(false);

    if (error) {
      setError("الرمز غير صحيح أو منتهي الصلاحية");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container" dir="rtl">
      <h1 className="title">تسجيل دخول أصحاب المحلات</h1>
      <p className="lead muted">
        {step === "email"
          ? "أدخل بريدك الإلكتروني وسنرسل لك رمز دخول"
          : "أدخل الرمز الذي وصلك على البريد"}
      </p>

      <div className="card" style={{ maxWidth: 420 }}>
        {step === "email" ? (
          <form onSubmit={sendCode}>
            <label className="label" htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              className="input"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%" }}
            />

            {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 14, width: "100%" }}
            >
              {loading ? "جارٍ الإرسال…" : "إرسال الرمز"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label className="label" htmlFor="code">رمز التحقق</label>
            <input
              id="code"
              className="input"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: "100%", letterSpacing: 4 }}
            />

            {notice && <p className="muted small" style={{ marginTop: 10 }}>{notice}</p>}
            {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 14, width: "100%" }}
            >
              {loading ? "جارٍ التحقق…" : "تأكيد وتسجيل الدخول"}
            </button>

            <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
              <button
                type="button"
                className="small-btn"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                  setNotice("");
                }}
              >
                تغيير البريد
              </button>
              <button
                type="button"
                className="small-btn"
                onClick={() => sendCode()}
                disabled={loading}
              >
                إعادة إرسال الرمز
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
