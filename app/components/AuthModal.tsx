"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { getProfile, dashboardHref, type AccountType } from "@/app/lib/profile";

type Step = "email" | "code" | "profile";

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // حقول الملف (للمستخدم الجديد)
  const [accountType, setAccountType] = useState<AccountType>("goldsmith");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");

  if (!open) return null;

  function reset() {
    setStep("email");
    setCode("");
    setError("");
    setNotice("");
  }

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
    if (error) {
      setLoading(false);
      setError("الرمز غير صحيح أو منتهي الصلاحية");
      return;
    }

    // مستخدم موجود له ملف؟ → توجيه مباشر
    const profile = await getProfile();
    if (profile) {
      setLoading(false);
      onClose();
      router.push(dashboardHref(profile.account_type));
      return;
    }

    // مستخدم جديد — نجهّز خطوة اختيار نوع الحساب (مع تعبئة إن كان صائغاً مسبقاً)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: shop } = await supabase
        .from("shops")
        .select("name")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (shop) {
        setAccountType("goldsmith");
        setShopName((shop as { name: string }).name ?? "");
      }
    }
    setLoading(false);
    setStep("profile");
  }

  async function saveProfile(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("الرجاء إدخال الاسم");
      return;
    }
    if (accountType === "goldsmith" && !shopName.trim()) {
      setError("الرجاء إدخال اسم المحل");
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("انتهت الجلسة، أعيدي المحاولة");
      return;
    }
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      account_type: accountType,
      name: name.trim(),
      email: user.email ?? email.trim(),
      phone: phone.trim() || null,
      shop_name: accountType === "goldsmith" ? shopName.trim() : null,
      location: accountType === "goldsmith" ? location.trim() || null : null,
    });
    setLoading(false);
    if (error) {
      setError("تعذّر حفظ الحساب، حاولي مرة أخرى");
      return;
    }
    onClose();
    router.push(dashboardHref(accountType));
  }

  return (
    <div
      className="am-overlay"
      dir="rtl"
      onClick={() => {
        onClose();
        reset();
      }}
    >
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-head">
          <h2>{step === "profile" ? "أنشئي حسابك" : "دخول / تسجيل"}</h2>
          <button
            className="am-x"
            aria-label="إغلاق"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            ✕
          </button>
        </div>

        {step === "email" && (
          <form onSubmit={sendCode}>
            <p className="am-lead">أدخلي بريدك وسنرسل لك رمز دخول</p>
            <label className="am-label">البريد الإلكتروني</label>
            <input
              className="am-input"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="am-error">{error}</p>}
            <button type="submit" className="am-btn" disabled={loading}>
              {loading ? "جارٍ الإرسال…" : "إرسال رمز الدخول"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode}>
            <p className="am-lead">أدخلي الرمز الذي وصلك على بريدك</p>
            <label className="am-label">رمز التحقق</label>
            <input
              className="am-input am-code"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {notice && <p className="am-notice">{notice}</p>}
            {error && <p className="am-error">{error}</p>}
            <button type="submit" className="am-btn" disabled={loading}>
              {loading ? "جارٍ التحقق…" : "تأكيد"}
            </button>
            <button type="button" className="am-link" onClick={() => setStep("email")}>
              تغيير البريد
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={saveProfile}>
            <p className="am-lead">اختاري نوع حسابك</p>
            <div className="am-types">
              <button
                type="button"
                className={accountType === "goldsmith" ? "am-type active" : "am-type"}
                onClick={() => setAccountType("goldsmith")}
              >
                <span className="am-emoji">🏪</span>
                صائغ
                <small>إدارة محلك ومخزونك</small>
              </button>
              <button
                type="button"
                className={accountType === "aurum" ? "am-type active" : "am-type"}
                onClick={() => setAccountType("aurum")}
              >
                <span className="am-emoji">💛</span>
                Aurum
                <small>ادّخار الذهب بذكاء</small>
              </button>
            </div>

            <label className="am-label">الاسم</label>
            <input
              className="am-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك الكامل"
            />

            <label className="am-label">رقم الهاتف</label>
            <input
              className="am-input"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXXX"
            />

            {accountType === "goldsmith" && (
              <>
                <label className="am-label">اسم المحل</label>
                <input
                  className="am-input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="اسم محلك"
                />
                <label className="am-label">موقع المحل</label>
                <input
                  className="am-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="المحافظة / العنوان"
                />
              </>
            )}

            {error && <p className="am-error">{error}</p>}
            <button type="submit" className="am-btn" disabled={loading}>
              {loading ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .am-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 5000;
        }
        .am-modal {
          width: 100%;
          max-width: 440px;
          max-height: 92vh;
          overflow-y: auto;
          background: #111112;
          border: 1px solid rgba(215, 180, 90, 0.35);
          border-radius: 22px;
          padding: 22px;
        }
        .am-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .am-head h2 {
          margin: 0;
          color: var(--gold2);
          font-size: 22px;
        }
        .am-x {
          background: none;
          border: 0;
          color: var(--muted);
          font-size: 18px;
          cursor: pointer;
        }
        .am-lead {
          color: var(--muted);
          font-size: 14px;
          margin: 6px 0 16px;
        }
        .am-label {
          display: block;
          color: var(--gold2);
          font-size: 13px;
          font-weight: 600;
          margin: 12px 0 6px;
        }
        .am-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 12px;
          padding: 11px 13px;
          color: #fff;
          outline: none;
        }
        .am-input:focus {
          border-color: var(--gold2);
        }
        .am-code {
          letter-spacing: 6px;
          text-align: center;
          font-size: 20px;
        }
        .am-btn {
          width: 100%;
          margin-top: 16px;
          padding: 13px;
          border: 0;
          border-radius: 999px;
          font-weight: 800;
          color: #111;
          cursor: pointer;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .am-btn:disabled {
          opacity: 0.6;
        }
        .am-link {
          display: block;
          margin: 12px auto 0;
          background: none;
          border: 0;
          color: var(--muted);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }
        .am-error {
          color: #ff8f8f;
          font-size: 13px;
          margin: 10px 0 0;
        }
        .am-notice {
          color: var(--gold2);
          font-size: 13px;
          margin: 10px 0 0;
        }
        .am-types {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 6px;
        }
        .am-type {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px 10px;
          border-radius: 16px;
          border: 1px solid rgba(215, 180, 90, 0.3);
          background: rgba(0, 0, 0, 0.3);
          color: var(--text);
          cursor: pointer;
          font-weight: 700;
        }
        .am-type.active {
          border-color: var(--gold2);
          background: rgba(215, 180, 90, 0.12);
        }
        .am-emoji {
          font-size: 26px;
        }
        .am-type small {
          color: var(--muted);
          font-weight: 400;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
