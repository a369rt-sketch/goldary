"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useT } from "@/app/lib/i18n";
import { useCurrency, type Currency } from "@/app/lib/currency";
import { type Lang } from "@/app/lib/language";
import { getProfile, dashboardHref, type AccountType } from "@/app/lib/profile";
import AuthModal from "@/app/components/AuthModal";
import AccountSlot, { type OwnerShop } from "@/app/components/AccountSlot";

type MaybeSession = { user?: { id?: string } } | null;

// نفس روابط الهيدر/الفوتر العام — لا يُحذف أي رابط.
const NAV = [
  { href: "/", key: "nav_prices" as const },
  { href: "/magazine", key: "nav_magazine" as const },
  { href: "/shops", key: "nav_shops" as const },
  { href: "/collection", key: "nav_collection" as const },
  { href: "/market", key: "nav_market" as const },
];

export default function MagazineHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useT();
  const [currency, setCurrency] = useCurrency();

  const [open, setOpen] = useState(false);
  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // نفس منطق الهيدر العام لجلب الجلسة/المحل/نوع الحساب
  useEffect(() => {
    let alive = true;
    async function loadForUser(userId: string | null) {
      if (!alive) return;
      setLoggedIn(!!userId);
      if (!userId) {
        setShop(null);
        setAccountType(null);
        return;
      }
      const { data } = await supabase
        .from("shops")
        .select("id, name, logo_url")
        .eq("owner_id", userId)
        .maybeSingle();
      if (alive) setShop((data as OwnerShop) ?? null);
      const profile = await getProfile();
      if (alive) setAccountType(profile?.account_type ?? null);
    }

    supabase.auth
      .getUser()
      .then((res: { data: { user: { id?: string } | null } }) =>
        loadForUser(res.data.user?.id ?? null)
      );
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_e: string, session: MaybeSession) => loadForUser(session?.user?.id ?? null)
    );
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // أغلق الدرج عند تغيّر المسار، واقفل تمرير الخلفية عند فتحه
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <header className="mag-hdr">
        <a href="/" className="mag-shine mag-wordmark mag-logo">
          Goldary
        </a>
        <button
          type="button"
          aria-label={t.mag_menu}
          aria-expanded={open}
          className="mag-burger"
          onClick={() => setOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4E3C31" strokeWidth="1.8" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="8" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="mag-drawer-backdrop" onClick={() => setOpen(false)}>
          <div
            className="mag-drawer"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mag-drawer-top">
              <span className="mag-shine mag-wordmark mag-drawer-logo">Goldary</span>
              <button
                type="button"
                aria-label={t.close}
                className="mag-drawer-close"
                onClick={() => setOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <nav className="mag-drawer-nav">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : !!pathname?.startsWith(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={active ? "mag-drawer-link active" : "mag-drawer-link"}
                  >
                    {t[item.key]}
                  </a>
                );
              })}
              <a href="/aurum" className="mag-drawer-link">Aurum</a>
            </nav>

            <div className="mag-drawer-toggles">
              <div className="mag-drawer-row">
                <span className="mag-drawer-label">{t.currency}</span>
                <div className="mag-seg" role="group" aria-label={t.currency}>
                  {(["USD", "IQD"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={currency === c ? "mag-seg-btn active" : "mag-seg-btn"}
                      onClick={() => setCurrency(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mag-drawer-row">
                <span className="mag-drawer-label">{t.language}</span>
                <div className="mag-seg" role="group" aria-label={t.language}>
                  {([
                    { v: "ar" as Lang, l: "عربي" },
                    { v: "en" as Lang, l: "EN" },
                  ]).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      className={lang === o.v ? "mag-seg-btn active" : "mag-seg-btn"}
                      onClick={() => setLang(o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mag-drawer-account">
              <AccountSlot
                loggedIn={loggedIn}
                shop={shop}
                dashHref={dashboardHref(accountType)}
                onLoginClick={() => {
                  setOpen(false);
                  setAuthOpen(true);
                }}
                onLogout={logout}
              />
            </div>

            <div className="mag-drawer-legal">
              <a href="/terms">{t.terms}</a>
              <span aria-hidden>·</span>
              <a href="/privacy">{t.privacy}</a>
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style jsx>{`
        .mag-hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px 10px;
        }
        .mag-logo {
          font-size: 30px;
          text-decoration: none;
        }
        .mag-burger {
          width: 44px;
          height: 44px;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .mag-drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 4000;
          background: rgba(46, 42, 37, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          justify-content: flex-start;
        }
        .mag-drawer {
          width: min(320px, 86vw);
          height: 100%;
          background: #f4eee3;
          color: #2e2a25;
          padding: 18px 18px calc(20px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 0 40px rgba(46, 42, 37, 0.35);
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          animation: mag-drawer-in 0.22s ease-out;
        }
        @keyframes mag-drawer-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        :global([dir="ltr"]) .mag-drawer-backdrop { justify-content: flex-end; }
        :global([dir="ltr"]) .mag-drawer { animation: mag-drawer-in-ltr 0.22s ease-out; }
        @keyframes mag-drawer-in-ltr {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mag-drawer { animation: none; }
        }
        .mag-drawer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .mag-drawer-logo { font-size: 26px; }
        .mag-drawer-close {
          width: 40px;
          height: 40px;
          border: 0;
          background: transparent;
          color: #4e3c31;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .mag-drawer-nav {
          display: flex;
          flex-direction: column;
        }
        .mag-drawer-link {
          padding: 14px 6px;
          font-size: 16px;
          font-weight: 600;
          color: #4e3c31;
          text-decoration: none;
          border-bottom: 1px solid rgba(46, 42, 37, 0.12);
        }
        .mag-drawer-link.active { color: #6b5446; border-bottom-color: #6b5446; }
        .mag-drawer-link:hover { color: #2e2a25; }
        .mag-drawer-toggles {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 4px 4px;
        }
        .mag-drawer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mag-drawer-label { font-size: 14px; color: #4a4238; }
        .mag-seg {
          display: inline-flex;
          border: 1px solid rgba(107, 84, 70, 0.4);
          border-radius: 999px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.35);
        }
        .mag-seg-btn {
          border: 0;
          background: transparent;
          color: #6b5446;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          cursor: pointer;
          min-height: 36px;
        }
        .mag-seg-btn.active { background: #6b5446; color: #f4eee3; }
        .mag-drawer-account {
          padding: 16px 4px 6px;
          border-top: 1px solid rgba(46, 42, 37, 0.12);
          margin-top: 8px;
        }
        .mag-drawer-legal {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px 4px 0;
          font-size: 13px;
        }
        .mag-drawer-legal a { color: #4e3c31; text-decoration: none; }
        .mag-drawer-legal a:hover { color: #2e2a25; text-decoration: underline; }
      `}</style>
    </>
  );
}
