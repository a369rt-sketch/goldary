"use client";

import { useT } from "@/app/lib/i18n";

export default function SiteFooter() {
  const { t } = useT();

  const QUICK_LINKS = [
    { href: "/", label: t.nav_prices },
    { href: "/magazine", label: t.nav_magazine },
    { href: "/shops", label: t.nav_shops },
    { href: "/aurum", label: "Aurum" },
  ];

  return (
    <footer className="ftr">
      <div className="ftr-inner">
        {/* نبذة */}
        <div className="ftr-col ftr-about">
          <span className="ftr-logo">Goldary</span>
          <p className="ftr-desc">{t.footer_desc}</p>
        </div>

        {/* روابط سريعة */}
        <div className="ftr-col">
          <h4 className="ftr-title">{t.quick_links}</h4>
          <ul className="ftr-links">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* عن التطبيق */}
        <div className="ftr-col">
          <h4 className="ftr-title">{t.about_app}</h4>
          <p className="ftr-desc">{t.footer_about}</p>
        </div>
      </div>

      <div className="ftr-bottom">
        <span>{t.rights}</span>
        <span className="ftr-by">{t.curated_by}</span>
      </div>

      <style jsx>{`
        .ftr {
          border-top: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.35);
          margin-top: 60px;
        }
        .ftr-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 28px;
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr;
          gap: 40px;
        }
        .ftr-logo {
          font-size: 24px;
          font-weight: 900;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ftr-desc {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.9;
          margin: 12px 0 0;
        }
        .ftr-title {
          color: var(--gold2);
          font-size: 15px;
          margin: 0 0 14px;
        }
        .ftr-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
        }
        .ftr-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }
        .ftr-links a:hover {
          color: var(--gold2);
        }
        .ftr-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 24px;
          border-top: 1px solid var(--stroke);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--muted);
          font-size: 13px;
        }
        .ftr-by {
          color: var(--gold);
        }

        @media (max-width: 767px) {
          .ftr {
            margin-top: 40px;
          }
          .ftr-inner {
            grid-template-columns: 1fr;
            gap: 26px;
            padding: 32px 18px 20px;
            text-align: center;
          }
          .ftr-desc {
            font-size: 13px;
          }
          .ftr-links {
            gap: 8px;
          }
          .ftr-bottom {
            flex-direction: column;
            gap: 6px;
            text-align: center;
            padding: 16px 18px;
            font-size: 12px;
          }
        }
      `}</style>
    </footer>
  );
}
