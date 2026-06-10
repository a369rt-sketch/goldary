"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { type Shop } from "@/app/lib/shops";
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

  // كل المحلات، مرتّبة بالأحدث
  async function loadShops() {
    setLoadingShops(true);
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErr("تعذّر جلب المحلات");
      setShops([]);
    } else {
      setShops((data ?? []) as ShopRow[]);
    }
    setLoadingShops(false);
  }

  // حماية مزدوجة: مسجّل دخول + أدمن
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!auth.user) {
        router.replace(LOGIN_PATH);
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (!adminRow) {
        setAccess("denied");
        return;
      }

      setAccess("granted");
      await loadShops();
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

    const { error } = await supabase
      .from("shops")
      .update({ status })
      .eq("id", shop.id);

    setBusyId(null);

    if (error) {
      setErr("تعذّر تنفيذ الإجراء، حاول مرة أخرى");
      return;
    }

    // انقل المحل لمجموعته الجديدة (تحديث محلي)
    setShops((prev) =>
      prev.map((s) => (s.id === shop.id ? { ...s, status } : s))
    );
    setMsg(`${verb} "${shop.name}"`);
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

    const { error } = await supabase.from("shops").delete().eq("id", shop.id);

    setBusyId(null);

    if (error) {
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
