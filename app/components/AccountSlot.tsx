"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useT } from "@/app/lib/i18n";

export type OwnerShop = { id: string; name: string | null; logo_url: string | null };

// مكوّن مستقل بنطاق أنماط خاص — دخول أو قائمة حساب الصاغة.
// مصدر واحد للحقيقة يُستعمل في الهيدر العام وهيدر المجلة.
export default function AccountSlot({
  loggedIn,
  shop,
  dashHref,
  onLoginClick,
  onLogout,
}: {
  loggedIn: boolean;
  shop: OwnerShop | null;
  dashHref: string;
  onLoginClick: () => void;
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
        <button type="button" className="login-btn" onClick={onLoginClick}>
          {t.login}
        </button>
        <style jsx>{`
          .login-btn {
            display: inline-block;
            border: 0;
            text-decoration: none;
            font-weight: 800;
            font-size: 14px;
            color: #111;
            padding: 9px 18px;
            border-radius: 999px;
            cursor: pointer;
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
          <a href={dashHref} role="menuitem" className="acct-item">
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
