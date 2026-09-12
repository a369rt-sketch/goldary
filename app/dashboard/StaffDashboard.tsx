"use client";

import { useState } from "react";
import ShopInventory from "./ShopInventory";
import ShopInvoices from "./ShopInvoices";
import ShopReports from "./ShopReports";
import ShopStock from "./ShopStock";

// لوحة الموظف: يرى أدوات محله المسموح بها فقط (حسب permissions) — بتبويبات متّسقة مع لوحة المالك.
export default function StaffDashboard({
  shopId,
  shopName,
  pro,
  permissions,
}: {
  shopId: string;
  shopName: string;
  pro: boolean;
  permissions: string[];
}) {
  const can = (p: string) => permissions.includes(p);
  const tabs = [
    { key: "invoices", label: "الفواتير" },
    { key: "inventory", label: "المخزون" },
    { key: "reports", label: "التقارير" },
  ].filter((tb) => can(tb.key));

  const [tab, setTab] = useState("");
  const active = tab || tabs[0]?.key || "";

  return (
    <>
      <div className="stf-banner">
        👤 أنت تعمل كموظف في <b>{shopName || "المحل"}</b>
      </div>

      {!pro ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-title">اشتراك المحل غير فعّال</div>
          <p className="muted" style={{ marginTop: 6 }}>
            الأدوات التشغيلية مقفلة حالياً. تواصل مع صاحب المحل لتفعيل الاشتراك.
          </p>
        </div>
      ) : tabs.length === 0 ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-title">لا توجد صلاحيات</div>
          <p className="muted" style={{ marginTop: 6 }}>
            لم يمنحك صاحب المحل أي صلاحيات بعد.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 14,
              marginBottom: 18,
              borderBottom: "1px solid var(--stroke)",
            }}
          >
            {tabs.map((tb) => {
              const on = active === tb.key;
              return (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setTab(tb.key)}
                  style={{
                    whiteSpace: "nowrap",
                    border: on ? "0" : "1px solid var(--stroke)",
                    background: on ? "linear-gradient(135deg,#f2d27b,#d7b45a)" : "transparent",
                    color: on ? "#111" : "var(--muted)",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "8px 16px",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>

          {active === "invoices" && (
            <ShopInvoices
              shopUserId={shopId}
              shop={{ name: shopName, phone: null, province: null, logo_url: null }}
            />
          )}
          {active === "inventory" && <ShopInventory shopUserId={shopId} />}
          {active === "reports" && (
            <>
              <ShopReports shopUserId={shopId} />
              <ShopStock shopUserId={shopId} />
            </>
          )}
        </>
      )}

      <style jsx>{`
        .stf-banner {
          max-width: 720px;
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(215, 180, 90, 0.4);
          background: rgba(215, 180, 90, 0.1);
          color: var(--text);
          font-size: 14px;
        }
      `}</style>
    </>
  );
}
