"use client";

import { useT } from "@/app/lib/i18n";

export type LegalSection = {
  ar: { h: string; p: string[] };
  en: { h: string; p: string[] };
};

// صفحة قانونية ثنائية اللغة (شروط/خصوصية) — تعرض المحتوى حسب اللغة المختارة.
export default function LegalPage({
  titleAr,
  titleEn,
  updatedAr,
  updatedEn,
  introAr,
  introEn,
  sections,
}: {
  titleAr: string;
  titleEn: string;
  updatedAr: string;
  updatedEn: string;
  introAr: string;
  introEn: string;
  sections: LegalSection[];
}) {
  const { lang, dir } = useT();
  const ar = lang === "ar";

  return (
    <main className="container" dir={dir}>
      <div className="row-between">
        <h1 className="title">{ar ? titleAr : titleEn}</h1>
        <a href="/" className="btn-secondary">{ar ? "الرئيسية" : "Home"}</a>
      </div>
      <p className="muted small" style={{ marginTop: -4 }}>{ar ? updatedAr : updatedEn}</p>

      <div className="legal card">
        <p className="legal-intro">{ar ? introAr : introEn}</p>
        {sections.map((s, i) => {
          const c = ar ? s.ar : s.en;
          return (
            <section key={i} className="legal-sec">
              <h2>
                {i + 1}. {c.h}
              </h2>
              {c.p.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </section>
          );
        })}
      </div>

      <style jsx>{`
        .legal {
          max-width: 820px;
          margin-top: 14px;
          line-height: 1.9;
        }
        .legal-intro {
          color: var(--text);
          margin: 0 0 8px;
        }
        .legal-sec {
          margin-top: 22px;
        }
        .legal-sec h2 {
          color: var(--gold2);
          font-size: 18px;
          margin: 0 0 8px;
        }
        .legal-sec p {
          color: var(--muted);
          margin: 0 0 10px;
          font-size: 15px;
        }
      `}</style>
    </main>
  );
}
