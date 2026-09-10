"use client";

import { isPro } from "@/app/lib/subscription";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

// بطاقة حالة الاشتراك لصاحب المحل + دعوة للترقية عند الخطة المجانية.
export default function SubscriptionCard({
  plan,
  expiresAt,
}: {
  plan: string | null | undefined;
  expiresAt: string | null | undefined;
}) {
  const pro = isPro({ plan, plan_expires_at: expiresAt });

  return (
    <section className="sub card">
      <div className="sub-head">
        <div className="card-title">الاشتراك</div>
        <span className={pro ? "sub-badge pro" : "sub-badge free"}>
          {pro ? "احترافي (Pro)" : "مجاني"}
        </span>
      </div>

      {pro ? (
        <p className="muted" style={{ margin: 0 }}>
          اشتراكك الاحترافي فعّال
          {expiresAt ? ` حتى ${dateFmt(expiresAt)}` : " (دائم)"} — كل الأدوات التشغيلية مفعّلة.
        </p>
      ) : (
        <>
          <p className="muted" style={{ margin: "0 0 10px" }}>
            أنت على الخطة المجانية: ملفك ومنتجاتك ظاهرة في السوق. الأدوات الاحترافية مقفلة:
          </p>
          <ul className="sub-feats">
            <li>🧾 الفواتير والإيصالات</li>
            <li>📊 التقارير وسجلّ المبيعات</li>
            <li>📦 تتبّع المخزون والقيمة</li>
          </ul>
          <div className="sub-cta">
            للاشتراك في الخطة الاحترافية، تواصل مع إدارة Goldary لتفعيلها لمحلّك.
          </div>
        </>
      )}

      <style jsx>{`
        .sub {
          max-width: 720px;
          border: 1px solid rgba(215, 180, 90, 0.3);
        }
        .sub-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .sub-badge {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 999px;
        }
        .sub-badge.pro {
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
        }
        .sub-badge.free {
          color: var(--muted);
          border: 1px solid var(--stroke);
        }
        .sub-feats {
          margin: 0 0 12px;
          padding-inline-start: 6px;
          list-style: none;
          display: grid;
          gap: 6px;
          color: var(--text);
          font-size: 14px;
        }
        .sub-cta {
          background: rgba(215, 180, 90, 0.1);
          border: 1px solid rgba(215, 180, 90, 0.3);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: var(--gold2);
        }
      `}</style>
    </section>
  );
}
