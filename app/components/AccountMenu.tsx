"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

type MaybeSession = { user?: { id?: string } } | null;

type OwnerShop = {
  id: string;
  name: string | null;
  logo_url: string | null;
};

export default function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // جلب محل المالك للمستخدم المسجّل (يُعاد عند تغيّر حالة المصادقة)
  useEffect(() => {
    let alive = true;

    async function loadForUser(userId: string | null) {
      if (!userId) {
        if (alive) setShop(null);
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
      (_event: string, session: MaybeSession) => {
        loadForUser(session?.user?.id ?? null);
        setOpen(false);
      }
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function logout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  }

  // لا تظهر في صفحات الأدمن، ولا لغير المسجّلين/بلا محل مرتبط
  if (pathname?.startsWith("/admin")) return null;
  if (!shop) return null;

  const initial = (shop.name?.trim()?.[0] ?? "؟").toUpperCase();

  return (
    <div ref={boxRef} className="acct" dir="rtl">
      <button
        type="button"
        className="acct-btn"
        aria-label="حساب المحل"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {shop.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logo_url} alt={shop.name ?? "المحل"} />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {open && (
        <div className="acct-menu" role="menu">
          <a href="/dashboard" role="menuitem" className="acct-item">
            محلي
          </a>
          <button
            type="button"
            role="menuitem"
            className="acct-item acct-logout"
            onClick={logout}
          >
            تسجيل الخروج
          </button>
        </div>
      )}

      <style jsx>{`
        .acct {
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 4000;
        }
        .acct-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #111;
          font-weight: 800;
          font-size: 18px;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 16px rgba(215, 180, 90, 0.4);
        }
        .acct-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .acct-menu {
          position: absolute;
          top: 50px;
          left: 0;
          min-width: 170px;
          padding: 6px;
          border-radius: 14px;
          background: #111111;
          border: 1px solid rgba(215, 180, 90, 0.35);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
          display: grid;
          gap: 2px;
          z-index: 4001;
        }
        .acct-item {
          display: block;
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
        .acct-logout {
          color: #ff8f8f;
        }
      `}</style>
    </div>
  );
}
