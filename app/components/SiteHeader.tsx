"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useCurrency, type Currency } from "@/app/lib/currency";

type MaybeSession = { user?: { id?: string } } | null;
type OwnerShop = { id: string; name: string | null; logo_url: string | null };

// روابط التنقّل
const NAV = [
  { href: "/", label: "الأسعار الحالية" },
  { href: "/magazine", label: "المجلة" },
  { href: "/shops", label: "المحلات" },
];

// الرابط نشط: مطابقة تامة للرئيسية، وبادئة لغيرها
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
    <div className="cur" role="group" aria-label="العملة">
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

// مكوّن مستقل بنطاق أنماط خاص (مضمون عبر styled-jsx) — دخول أو قائمة حساب الصاغة.
function AccountSlot({
  loggedIn,
  shop,
  onLogout,
}: {
  loggedIn: boolean;
  shop: OwnerShop | null;
  onLogout: () => void;
}) {
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
          دخول
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

  const initial = (shop?.name?.trim()?.[0] ?? "ح").toUpperCase();

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
          <img src={shop.logo_url} alt={shop.name ?? "حسابي"} />
        ) : (
          <span>{initial}</span>
        )}
        <ChevronDown size={16} className="acct-caret" />
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <a href="/dashboard" role="menuitem" className="acct-item">
            <LayoutDashboard size={15} /> لوحة التحكم
          </a>
          <button
            type="button"
            role="menuitem"
            className="acct-item danger"
            onClick={onLogout}
          >
            <LogOut size={15} /> تسجيل الخروج
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
          inset-inline-start: 0;
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
          text-align: right;
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
  const [currency, setCurrency] = useCurrency();

  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // قائمة الموبايل

  // حالة المصادقة + محل المالك
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

  // إغلاق قائمة الموبايل عند تغيّر الصفحة
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // لا نعرض الـHeader في صفحات الأدمن
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="hdr" dir="rtl">
      <div className="hdr-inner">
        {/* زر الهامبرغر (موبايل فقط) */}
        <button
          type="button"
          className="hamburger"
          aria-label="القائمة"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* الشعار */}
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
              {item.label}
            </a>
          ))}
        </nav>

        {/* الأدوات (ديسكتوب): عملة + حساب */}
        <div className="tools">
          <CurrencyToggle currency={currency} onChange={setCurrency} />
          <AccountSlot loggedIn={loggedIn} shop={shop} onLogout={logout} />
        </div>

        {/* شريحة الحساب في الموبايل (يمين) */}
        <div className="tools-mobile">
          <AccountSlot loggedIn={loggedIn} shop={shop} onLogout={logout} />
        </div>
      </div>

      {/* لوحة الموبايل المنسدلة */}
      {menuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="mobile-link">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mobile-cur">
            <span className="mobile-cur-label">العملة</span>
            <CurrencyToggle currency={currency} onChange={setCurrency} />
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
        .hdr-inner {
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
          margin-inline-start: 8px;
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
          margin-inline-start: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tools-mobile {
          display: none;
        }
        .hamburger {
          display: none;
          background: transparent;
          border: 0;
          color: var(--gold2);
          cursor: pointer;
          padding: 4px;
        }
        /* لوحة الموبايل */
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
        .mobile-cur {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 8px 4px;
        }
        .mobile-cur-label {
          color: var(--muted);
          font-size: 14px;
        }

        /* ===== موبايل: أقل من 768px ===== */
        @media (max-width: 767px) {
          .hdr-inner {
            /* اتجاه ثابت للشريط: هامبرغر يسار · شعار وسط · دخول يمين */
            direction: ltr;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
          }
          .hamburger {
            display: inline-flex;
            justify-self: start;
          }
          .logo {
            justify-self: center;
            font-size: 20px;
          }
          .nav,
          .tools {
            display: none;
          }
          .tools-mobile {
            display: flex;
            justify-self: end;
          }
          .mobile-menu {
            display: block;
            padding: 8px 16px 18px;
            border-top: 1px solid var(--stroke);
            background: rgba(11, 11, 14, 0.98);
          }
        }

        /* ===== ديسكتوب واسع: 1200px+ ===== */
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
