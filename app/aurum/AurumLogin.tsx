"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

// تسجيل دخول بالبريد (OTP) داخل Aurum — عند النجاح يتغيّر حالة المصادقة فتُعرَض اللوحة.
export default function AurumLogin() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setError("تعذّر إرسال الرمز، حاولي مرة أخرى");
      return;
    }
    setStep("code");
    setNotice("أرسلنا رمزاً مكوّناً من 6 أرقام إلى بريدك");
  }

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
    // لا توجيه — الأب يستمع لتغيّر المصادقة ويعرض اللوحة
  }

  return (
    <div className="au-login" dir="rtl">
      <div className="au-card">
        <p className="au-login-lead">
          {step === "email"
            ? "سجّلي الدخول ببريدك لتبدئي رحلة الادّخار بالذهب"
            : "أدخلي الرمز الذي وصلك على بريدك"}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode}>
            <label className="au-label">البريد الإلكتروني</label>
            <input
              className="au-input"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="au-error">{error}</p>}
            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? "جارٍ الإرسال…" : "إرسال رمز الدخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label className="au-label">رمز التحقق</label>
            <input
              className="au-input au-code"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {notice && <p className="au-notice">{notice}</p>}
            {error && <p className="au-error">{error}</p>}
            <button type="submit" className="au-btn" disabled={loading}>
              {loading ? "جارٍ التحقق…" : "تأكيد وتسجيل الدخول"}
            </button>
            <div className="au-login-row">
              <button
                type="button"
                className="au-link"
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
                className="au-link"
                onClick={() => sendCode()}
                disabled={loading}
              >
                إعادة إرسال الرمز
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .au-login {
          max-width: 460px;
          margin: 10px auto 0;
        }
        .au-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(215, 180, 90, 0.28);
          border-radius: 20px;
          padding: 26px 22px;
        }
        .au-login-lead {
          color: var(--muted);
          margin: 0 0 18px;
          font-size: 15px;
          line-height: 1.7;
        }
        .au-label {
          display: block;
          color: var(--gold2);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .au-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 12px;
          padding: 12px 14px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .au-input:focus {
          border-color: var(--gold2);
        }
        .au-code {
          letter-spacing: 6px;
          text-align: center;
          font-size: 20px;
        }
        .au-btn {
          width: 100%;
          margin-top: 16px;
          padding: 13px;
          border: 0;
          border-radius: 999px;
          font-weight: 800;
          font-size: 15px;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .au-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .au-error {
          color: #ff8f8f;
          font-size: 13px;
          margin: 10px 0 0;
        }
        .au-notice {
          color: var(--gold2);
          font-size: 13px;
          margin: 10px 0 0;
        }
        .au-login-row {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
        }
        .au-link {
          background: none;
          border: 0;
          color: var(--muted);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
