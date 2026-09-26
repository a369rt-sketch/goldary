"use client";

import ReactMarkdown from "react-markdown";
import { type Article, localizedArticle } from "@/app/lib/articles";
import { fmt } from "@/app/lib/goldPricing";
import { useT } from "@/app/lib/i18n";
import ShareButton from "./ShareButton";

export default function ArticleView({ article }: { article: Article }) {
  const { t, lang, dir } = useT();

  // العرض حسب اللغة: الإنجليزية المعتمدة فقط، وإلا العربية
  const loc = localizedArticle(article, lang);
  const showEnPending = lang === "en" && !loc.isEnglish;

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  // مدة القراءة التقريبية (~200 كلمة/دقيقة)
  const words = (loc.content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 200));
  const meta = [dateFmt(article.published_at), t.mag_read_time.replace("{n}", String(readMin))]
    .filter(Boolean)
    .join("، ");

  return (
    <div className="mag-root" data-lang={lang} dir={dir}>
      <div className="mag-shell" style={{ paddingBottom: 40 }}>
        <div
          className="mag-drift"
          aria-hidden
          style={{
            position: "absolute",
            top: -100,
            insetInlineEnd: -120,
            width: 440,
            height: 440,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,250,240,0.32) 0%, rgba(255,250,240,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          {/* الهيدر: رجوع + Goldary + مشاركة */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px 10px",
              gap: 8,
            }}
          >
            <a
              href="/magazine"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                fontSize: 14,
                fontWeight: 600,
                color: "#4E3C31",
                textDecoration: "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4E3C31" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: dir === "ltr" ? "scaleX(-1)" : undefined }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
              {t.nav_magazine}
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ShareButton title={article.title} />
              <span className="mag-shine mag-wordmark" style={{ fontSize: 26 }}>Goldary</span>
            </div>
          </header>

          {/* رأس المقال */}
          <div style={{ padding: "10px 20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4E3C31" }}>
              {t.categories[article.category]}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--serif)",
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1.3,
                color: "#6B5446",
              }}
            >
              {loc.title}
            </h1>
            {loc.excerpt && (
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.85, color: "#2E2A25" }}>
                {loc.excerpt}
              </p>
            )}
            {meta && <span style={{ fontSize: 13, color: "#4A4238" }}>{meta}</span>}

            {article.price_snapshot_iqd != null && (
              <span style={{ fontSize: 13, color: "#4E3C31", marginTop: 2 }}>
                {t.snapshot_label} {fmt(Number(article.price_snapshot_iqd), "IQD")}
              </span>
            )}

            {showEnPending && (
              <span style={{ fontSize: 12.5, color: "#7A5A18", marginTop: 2 }}>
                {t.mag_en_pending}
              </span>
            )}
          </div>

          {/* بطاقة القراءة (cream) */}
          <article
            className="mag-md"
            style={{
              margin: "0 12px",
              background: "#F4EEE3",
              borderRadius: 20,
              padding: "26px 20px 30px",
              boxShadow: "0 16px 40px rgba(46,42,37,0.18)",
            }}
          >
            <ReactMarkdown
              components={{
                // eslint-disable-next-line @next/next/no-img-element
                img: ({ src, alt }) => (
                  <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} />
                ),
              }}
            >
              {loc.content ?? ""}
            </ReactMarkdown>
          </article>

          {/* تنويه */}
          <p style={{ margin: "22px 20px 0", fontSize: 13, lineHeight: 1.8, color: "#4A4238" }}>
            {t.mag_disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
