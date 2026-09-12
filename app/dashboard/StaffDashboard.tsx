"use client";

import ShopInventory from "./ShopInventory";
import ShopInvoices from "./ShopInvoices";
import ShopReports from "./ShopReports";
import ShopStock from "./ShopStock";

// لوحة الموظف: يرى أدوات محله المسموح بها فقط (حسب permissions).
// لا تسجيل محل ولا ملف/أسعار ولا إدارة موظفين ولا اشتراك.
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
      ) : permissions.length === 0 ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-title">لا توجد صلاحيات</div>
          <p className="muted" style={{ marginTop: 6 }}>
            لم يمنحك صاحب المحل أي صلاحيات بعد.
          </p>
        </div>
      ) : (
        <>
          {can("invoices") && (
            <ShopInvoices
              shopUserId={shopId}
              shop={{ name: shopName, phone: null, province: null, logo_url: null }}
            />
          )}
          {can("inventory") && <ShopInventory shopUserId={shopId} />}
          {can("reports") && (
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
