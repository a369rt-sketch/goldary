"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { authFetch } from "@/app/lib/useAuth";
import { type Shop } from "@/app/lib/shops";
import { setShopPlan, isPro } from "@/app/lib/subscription";
import { provinces } from "@/app/lib/provinces";

// مسار تسجيل الدخول (موجود بالمشروع) — عدّله من هنا لو تغيّر
const LOGIN_PATH = "/owner/login";

// مفتاح المحافظة → الاسم العربي
const provinceName = (key: string) =>
  provinces.find((p) => p.key === key)?.name ?? key;

type Access = "checking" | "denied" | "granted";

type ShopStatus = "pending" | "approved" | "rejected" | "hidden";
type ShopRow = Shop & { status: ShopStatus };

// المجموعات بالترتيب المعروض على الشاشة
const STATUS_GROUPS: { status: ShopStatus; title: string }[] = [
  { status: "pending", title: "قيد الانتظار" },
  { status: "approved", title: "المعتمدة" },
  { status: "rejected", title: "المرفوضة" },
  { status: "hidden", title: "المخفية" },
];

export default function AdminShopsPage() {
  const router = useRouter();

  const [access, setAccess] = useState<Access>("checking");
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  // استدعاء واحد لمسار الأدمن (service role): يقرّر الصلاحية والبيانات معاً.
  //   401 → غير مسجّل → صفحة الدخول · 403 → غير أدمن → ممنوع · 200 → عرض المحلات.
  // نمرّر التوكن مباشرةً (من getSession) لتفادي استدعاء مصادقة إضافي.
  async function loadShops(token?: string) {
    setLoadingShops(true);
    setErr("");

    let res: Response;
    try {
      res = token
        ? await fetch("/api/admin/shops", {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await authFetch("/api/admin/shops");
    } catch {
      setAccess("granted"); // أظهر الصفحة مع خطأ بدل تعليق لانهائي
      setErr("تعذّر الاتصال بالخادم، أعيدي المحاولة");
      setShops([]);
      setLoadingShops(false);
      return;
    }

    if (res.status === 401) {
      router.replace(LOGIN_PATH);
      return;
    }
    if (res.status === 403) {
      setAccess("denied");
      setLoadingShops(false);
      return;
    }

    setAccess("granted");
    if (!res.ok) {
      setErr("تعذّر جلب المحلات");
      setShops([]);
      setLoadingShops(false);
      return;
    }

    const { shops: rows } = await res.json();
    setShops((rows ?? []) as ShopRow[]);
    setLoadingShops(false);
  }

  // بوابة الوصول: نقرأ الجلسة محلياً (getSession — بلا شبكة) مع مؤقّت حارس حتى
  // لا تعلّق الصفحة للأبد على "جارٍ التحقق". القرار النهائي (أدمن؟) على الخادم.
  useEffect(() => {
    let mounted = true;

    async function init() {
      let token: string | null = null;
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("session-timeout")), 8000)
          ),
        ]);
        token = result.data.session?.access_token ?? null;
      } catch {
        token = null; // تجاوز المؤقّت أو خطأ → عاملها كعدم وجود جلسة
      }
      if (!mounted) return;

      if (!token) {
        router.replace(LOGIN_PATH);
        return;
      }

      await loadShops(token);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  // تغيير حالة المحل (موافقة/رفض/إخفاء/إظهار)
  async function changeStatus(shop: ShopRow, status: ShopStatus, verb: string) {
    setMsg("");
    setErr("");
    setBusyId(shop.id);

    const res = await authFetch(`/api/admin/shops/${shop.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setBusyId(null);

    if (!res.ok) {
      setErr("تعذّر تنفيذ الإجراء، حاول مرة أخرى");
      return;
    }

    // انقل المحل لمجموعته الجديدة (تحديث محلي)
    setShops((prev) =>
      prev.map((s) => (s.id === shop.id ? { ...s, status } : s))
    );
    setMsg(`${verb} "${shop.name}"`);
  }

  // تفعيل/إلغاء اشتراك Pro عبر مسار الأدمن (service role)
  async function setPlan(shop: ShopRow, action: "month" | "year" | "free") {
    setMsg("");
    setErr("");
    setBusyId(shop.id);
    const res = await setShopPlan(shop.id, action);
    setBusyId(null);
    if (!res.ok) {
      setErr("تعذّر تحديث الاشتراك، حاول مرة أخرى");
      return;
    }
    const { shop: updated } = await res.json();
    setShops((prev) =>
      prev.map((s) =>
        s.id === shop.id
          ? { ...s, plan: updated.plan, plan_expires_at: updated.plan_expires_at }
          : s
      )
    );
    setMsg(`تم تحديث اشتراك "${shop.name}"`);
  }

  // حذف نهائي من جدول shops
  async function deleteShop(shop: ShopRow) {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف "${shop.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
      )
    ) {
      return;
    }

    setMsg("");
    setErr("");
    setBusyId(shop.id);

    const res = await authFetch(`/api/admin/shops/${shop.id}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!res.ok) {
      setErr("تعذّر حذف المحل، حاول مرة أخرى");
      return;
    }

    setShops((prev) => prev.filter((s) => s.id !== shop.id));
    setMsg(`تم حذف "${shop.name}" نهائياً`);
  }

  if (access === "checking") {
    return (
      <main className="container" dir="rtl">
        <p className="muted">جارٍ التحقق…</p>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="container" dir="rtl">
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-title">غير مصرّح لك بالدخول</div>
          <p className="muted" style={{ marginTop: 6 }}>
            هذه الصفحة مخصّصة للمشرفين فقط.
          </p>
        </div>
      </main>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? shops.filter((s) => s.name.toLowerCase().includes(q))
    : shops;

  return (
    <main className="container" dir="rtl">
      <h1 className="title">إدارة المحلات</h1>
      <p className="lead muted">راجع المحلات وغيّر حالتها</p>

      {err && <p className="error" style={{ marginTop: 8 }}>{err}</p>}
      {msg && (
        <p className="small" style={{ marginTop: 8, color: "#86efac" }}>
          {msg}
        </p>
      )}

      {!loadingShops && shops.length > 0 && (
        <div className="row" style={{ marginTop: 16 }}>
          <input
            className="input"
            type="text"
            placeholder="ابحث عن محل بالاسم"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
        </div>
      )}

      {loadingShops ? (
        <p className="muted" style={{ marginTop: 22 }}>جارٍ التحميل…</p>
      ) : shops.length === 0 ? (
        <div className="card" style={{ maxWidth: 520, marginTop: 16 }}>
          <p className="muted" style={{ margin: 0 }}>ماكو محلات</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ maxWidth: 520, marginTop: 16 }}>
          <p className="muted" style={{ margin: 0 }}>ماكو نتائج مطابقة</p>
        </div>
      ) : (
        STATUS_GROUPS.map((group) => {
          const list = filtered.filter((s) => s.status === group.status);
          if (list.length === 0) return null;

          return (
            <section key={group.status} style={{ marginTop: 24 }}>
              <h2 className="h2">
                {group.title} ({list.length})
              </h2>

              <div className="grid">
                {list.map((shop) => {
                  const busy = busyId === shop.id;

                  return (
                    <div key={shop.id} className="card">
                      <div className="card-title">{shop.name}</div>
                      <div className="muted small" style={{ marginTop: 4 }}>
                        {provinceName(shop.province)}
                      </div>

                      <div
                        className="tiny"
                        style={{ display: "grid", gap: 4, marginTop: 10 }}
                      >
                        <div className="row-between">
                          <span className="muted">الهاتف</span>
                          <span dir="ltr">{shop.phone || "—"}</span>
                        </div>
                        <div className="row-between">
                          <span className="muted">واتساب</span>
                          <span dir="ltr">{shop.whatsapp || "—"}</span>
                        </div>
                        <div className="row-between">
                          <span className="muted">العنوان</span>
                          <span>{shop.address || "—"}</span>
                        </div>
                      </div>

                      <div
                        className="row"
                        style={{ marginTop: 14, gap: 10, flexWrap: "wrap" }}
                      >
                        {shop.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="btn-primary small-btn"
                              disabled={busy}
                              onClick={() =>
                                changeStatus(shop, "approved", "تمت الموافقة على")
                              }
                            >
                              {busy ? "…" : "موافقة"}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary small-btn"
                              disabled={busy}
                              onClick={() =>
                                changeStatus(shop, "rejected", "تم رفض")
                              }
                            >
                              {busy ? "…" : "رفض"}
                            </button>
                          </>
                        )}

                        {shop.status === "approved" && (
                          <button
                            type="button"
                            className="btn-secondary small-btn"
                            disabled={busy}
                            onClick={() =>
                              changeStatus(shop, "hidden", "تم إخفاء")
                            }
                          >
                            {busy ? "…" : "إخفاء"}
                          </button>
                        )}

                        {shop.status === "hidden" && (
                          <button
                            type="button"
                            className="btn-primary small-btn"
                            disabled={busy}
                            onClick={() =>
                              changeStatus(shop, "approved", "تم إظهار")
                            }
                          >
                            {busy ? "…" : "إظهار"}
                          </button>
                        )}

                        <button
                          type="button"
                          className="small-btn"
                          disabled={busy}
                          onClick={() => deleteShop(shop)}
                          style={{
                            background: "transparent",
                            color: "#ff6b6b",
                            border: "1px solid rgba(255,107,107,0.6)",
                          }}
                        >
                          {busy ? "…" : "حذف نهائي"}
                        </button>
                      </div>

                      {shop.status === "approved" && (
                        <div
                          className="tiny"
                          style={{
                            marginTop: 12,
                            borderTop: "1px solid var(--stroke)",
                            paddingTop: 10,
                          }}
                        >
                          <div className="row-between" style={{ marginBottom: 8 }}>
                            <span className="muted">الاشتراك</span>
                            <span
                              style={{
                                fontWeight: 800,
                                color: isPro(shop) ? "#f2d27b" : "var(--muted)",
                              }}
                            >
                              {isPro(shop) ? "Pro" : "مجاني"}
                              {isPro(shop) && shop.plan_expires_at
                                ? ` · حتى ${new Date(shop.plan_expires_at).toLocaleDateString(
                                    "ar-EG",
                                    { day: "numeric", month: "short", year: "numeric" }
                                  )}`
                                : ""}
                            </span>
                          </div>
                          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn-secondary small-btn"
                              disabled={busy}
                              onClick={() => setPlan(shop, "month")}
                            >
                              ＋ شهر Pro
                            </button>
                            <button
                              type="button"
                              className="btn-secondary small-btn"
                              disabled={busy}
                              onClick={() => setPlan(shop, "year")}
                            >
                              ＋ سنة Pro
                            </button>
                            <button
                              type="button"
                              className="small-btn"
                              disabled={busy}
                              onClick={() => setPlan(shop, "free")}
                              style={{
                                background: "transparent",
                                color: "var(--muted)",
                                border: "1px solid var(--stroke)",
                              }}
                            >
                              مجاني
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
