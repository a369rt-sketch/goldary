"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useCurrency, type Currency } from "@/app/lib/currency";
import { useT } from "@/app/lib/i18n";
import { type Lang } from "@/app/lib/language";

type MaybeSession = { user?: { id?: string } } | null;
type OwnerShop = { id: string; name: string | null; logo_url: string | null };

// روابط التنقّل — التسميات تُترجَم عبر مفاتيح i18n
const NAV = [
  { href: "/", key: "nav_prices" as const },
  { href: "/magazine", key: "nav_magazine" as const },
  { href: "/shops", key: "nav_shops" as const },
];

function isActive(pathname: string | null, href: string) {
  return href === "/" ? pathname === "/" : !!pathname?.startsWith(href);
}

function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="cur" role="group" aria-label="Currency">
      {(["USD", "IQD"] as Currency[]).map((c) => (
        <button
          key={c}
          type="button"
          className={currency === c ? "cur-btn active" : "cur-btn"}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
      <style jsx>{`
        .cur {
          display: inline-flex;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.04);
        }
        .cur-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cur-btn.active {
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
      `}</style>
    </div>
  );
}

function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  const OPTIONS: { value: Lang; label: string }[] = [
    { value: "ar", label: "عربي" },
    { value: "en", label: "EN" },
  ];
  return (
    <div className="lang" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={lang === o.value ? "lang-btn active" : "lang-btn"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      <style jsx>{`
        .lang {
          display: inline-flex;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.04);
        }
        .lang-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lang-btn.active {
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
      `}</style>
    </div>
  );
}

// مكوّن مستقل بنطاق أنماط خاص — دخول أو قائمة حساب الصاغة.
function AccountSlot({
  loggedIn,
  shop,
  onLogout,
}: {
  loggedIn: boolean;
  shop: OwnerShop | null;
  onLogout: () => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!loggedIn) {
    return (
      <>
        <a href="/owner/login" className="login-btn">
          {t.login}
        </a>
        <style jsx>{`
          .login-btn {
            display: inline-block;
            text-decoration: none;
            font-weight: 800;
            font-size: 14px;
            color: #111;
            padding: 9px 18px;
            border-radius: 999px;
            background: linear-gradient(135deg, #f2d27b, #d7b45a);
            white-space: nowrap;
          }
        `}</style>
      </>
    );
  }

  const initial = (shop?.name?.trim()?.[0] ?? "G").toUpperCase();

  return (
    <div className="acct" ref={ref}>
      <button
        type="button"
        className="acct-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {shop?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logo_url} alt={shop.name ?? "account"} />
        ) : (
          <span>{initial}</span>
        )}
        <ChevronDown size={16} className="acct-caret" />
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <a href="/dashboard" role="menuitem" className="acct-item">
            <LayoutDashboard size={15} /> {t.dashboard}
          </a>
          <button
            type="button"
            role="menuitem"
            className="acct-item danger"
            onClick={onLogout}
          >
            <LogOut size={15} /> {t.logout}
          </button>
        </div>
      )}
      <style jsx>{`
        .acct {
          position: relative;
        }
        .acct-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 40px;
          padding: 0 8px 0 4px;
          border-radius: 999px;
          cursor: pointer;
          color: #111;
          font-weight: 800;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .acct-btn img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .acct-btn span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.12);
        }
        .acct-caret {
          color: #111;
        }
        .acct-menu {
          position: absolute;
          top: 48px;
          inset-inline-end: 0;
          min-width: 180px;
          padding: 6px;
          border-radius: 14px;
          background: #111111;
          border: 1px solid rgba(215, 180, 90, 0.35);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
          display: grid;
          gap: 2px;
          z-index: 3100;
        }
        .acct-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: start;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: 0;
          color: #f2d27b;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
        }
        .acct-item:hover {
          background: rgba(215, 180, 90, 0.12);
        }
        .acct-item.danger {
          color: #ff8f8f;
        }
      `}</style>
    </div>
  );
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useT();
  const [currency, setCurrency] = useCurrency();

  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadForUser(userId: string | null) {
      if (!alive) return;
      setLoggedIn(!!userId);
      if (!userId) {
        setShop(null);
        return;
      }
      const { data } = await supabase
        .from("shops")
        .select("id, name, logo_url")
        .eq("owner_id", userId)
        .maybeSingle();
      if (alive) setShop((data as OwnerShop) ?? null);
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="hdr">
      <div className="hdr-inner">
        {/* الشعار — يسار دائماً، ثابت في اللغتين */}
        <a href="/" className="logo">
          Goldary
        </a>

        {/* التنقّل (ديسكتوب) */}
        <nav className="nav">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? "nav-link active" : "nav-link"}
            >
              {t[item.key]}
            </a>
          ))}
        </nav>

        {/* الأدوات (ديسكتوب) */}
        <div className="tools">
          <CurrencyToggle currency={currency} onChange={setCurrency} />
          <LanguageToggle lang={lang} onChange={setLang} />
          <AccountSlot loggedIn={loggedIn} shop={shop} onLogout={logout} />
        </div>

        {/* أدوات الموبايل: دخول + هامبرغر (يمين) */}
        <div className="mobile-actions">
          <AccountSlot loggedIn={loggedIn} shop={shop} onLogout={logout} />
          <button
            type="button"
            className="hamburger"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* لوحة الموبايل المنسدلة */}
      {menuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="mobile-link">
                {t[item.key]}
              </a>
            ))}
          </nav>
          <div className="mobile-row">
            <span className="mobile-row-label">{t.currency}</span>
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
          <div className="mobile-row">
            <span className="mobile-row-label">{t.language}</span>
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
        </div>
      )}

      <style jsx>{`
        .hdr {
          position: sticky;
          top: 0;
          z-index: 3000;
          background: rgba(11, 11, 14, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--stroke);
        }
        /* الشريط دائماً LTR: الشعار يسار، الأدوات يمين — بصرف النظر عن لغة الصفحة */
        .hdr-inner {
          direction: ltr;
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .logo {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-decoration: none;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          white-space: nowrap;
        }
        .nav {
          display: flex;
          gap: 6px;
          margin-inline-start: auto; /* يدفع التنقّل والأدوات إلى اليمين */
        }
        .nav-link {
          color: var(--muted);
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.15s ease;
        }
        .nav-link:hover {
          color: var(--gold2);
          background: rgba(215, 180, 90, 0.08);
        }
        .nav-link.active {
          color: var(--gold2);
        }
        .tools {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mobile-actions {
          display: none;
          align-items: center;
          gap: 10px;
          margin-inline-start: auto;
        }
        .hamburger {
          background: transparent;
          border: 0;
          color: var(--gold2);
          cursor: pointer;
          padding: 4px;
          display: inline-flex;
        }
        .mobile-menu {
          display: none;
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
        }
        .mobile-link {
          color: var(--text);
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          padding: 14px 8px;
          border-bottom: 1px solid var(--stroke);
        }
        .mobile-link:hover {
          color: var(--gold2);
        }
        .mobile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 8px 0;
        }
        .mobile-row-label {
          color: var(--muted);
          font-size: 14px;
        }

        /* ===== موبايل: أقل من 768px ===== */
        @media (max-width: 767px) {
          .hdr-inner {
            padding: 10px 16px;
            gap: 10px;
          }
          .logo {
            font-size: 20px;
          }
          .nav,
          .tools {
            display: none;
          }
          .mobile-actions {
            display: flex;
          }
          .mobile-menu {
            display: block;
            direction: inherit;
            padding: 8px 16px 18px;
            border-top: 1px solid var(--stroke);
            background: rgba(11, 11, 14, 0.98);
          }
        }

        @media (min-width: 1200px) {
          .hdr-inner {
            padding: 14px 24px;
          }
          .nav-link {
            font-size: 16px;
          }
        }
      `}</style>
    </header>
  );
}
