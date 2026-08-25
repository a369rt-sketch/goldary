"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useT } from "@/app/lib/i18n";

type Step = "email" | "code";

export default function OwnerLoginPage() {
  const router = useRouter();
  const { t, dir } = useT();

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
      setError(t.login_err_email);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (error) {
      setError(t.login_err_send);
      return;
    }

    setStep("code");
    setNotice(t.login_notice_sent);
  }

  // الخطوة 2: التحقق من الرمز وتسجيل الدخول
  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    const token = code.trim();
    if (token.length < 6) {
      setError(t.login_err_code_full);
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
      setError(t.login_err_code_invalid);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container" dir={dir}>
      <h1 className="title">{t.login_title}</h1>
      <p className="lead muted">
        {step === "email" ? t.login_lead_email : t.login_lead_code}
      </p>

      <div className="card" style={{ maxWidth: 420 }}>
        {step === "email" ? (
          <form onSubmit={sendCode}>
            <label className="label" htmlFor="email">{t.login_label_email}</label>
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
              {loading ? t.login_btn_sending : t.login_btn_send}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label className="label" htmlFor="code">{t.login_label_code}</label>
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
              {loading ? t.login_btn_verifying : t.login_btn_verify}
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
                {t.login_btn_change_email}
              </button>
              <button
                type="button"
                className="small-btn"
                onClick={() => sendCode()}
                disabled={loading}
              >
                {t.login_btn_resend}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
