"use client";

import { useT } from "@/app/lib/i18n";

// شارة «محل موثّق» — تُعرض للمحلات المعتمدة (status='approved') كإشارة ثقة.
export default function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const { t } = useT();
  return (
    <span className={size === "md" ? "vb vb-md" : "vb"} title={t.verified_tip}>
      <span className="vb-check" aria-hidden>
        ✓
      </span>
      {t.verified}
      <style jsx>{`
        .vb {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          font-weight: 800;
          font-size: 11px;
          line-height: 1;
          padding: 3px 9px;
          border-radius: 999px;
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .vb-md {
          font-size: 13px;
          padding: 5px 12px;
        }
        .vb-check {
          display: grid;
          place-items: center;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.28);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
        }
        .vb-md .vb-check {
          width: 16px;
          height: 16px;
          font-size: 11px;
        }
      `}</style>
    </span>
  );
}
