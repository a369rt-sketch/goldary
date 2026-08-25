"use client";

import ReactMarkdown from "react-markdown";
import { type Article } from "@/app/lib/articles";
import { fmt } from "@/app/lib/goldPricing";
import { useT } from "@/app/lib/i18n";
import ShareButton from "./ShareButton";

const AFFECT_ICON: Record<string, string> = {
  local: "🟢",
  global: "🌍",
  dollar: "💵",
};

export default function ArticleView({ article }: { article: Article }) {
  const { t, lang } = useT();

  const affects = article.affects
    ? { icon: AFFECT_ICON[article.affects], label: t.affects[article.affects] }
    : null;

  const dateFmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  return (
    <main className="container mag-article">
      <div className="row-between" style={{ alignItems: "center" }}>
        <a href="/magazine" className="btn-secondary small-btn">
          {t.back_to_magazine}
        </a>
        <ShareButton title={article.title} />
      </div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <span className="mag-tag">{t.categories[article.category]}</span>
        {affects ? (
          <span className="mag-affects">
            {affects.icon} {t.affects_prefix} {affects.label}
          </span>
        ) : null}
      </div>

      <h1 className="title" style={{ marginTop: 12 }}>{article.title}</h1>

      {article.price_snapshot_iqd != null ? (
        <div className="snapshot">
          {t.snapshot_label} {fmt(Number(article.price_snapshot_iqd), "IQD")}
        </div>
      ) : null}

      {article.published_at ? (
        <div className="muted small" style={{ marginTop: 8 }}>
          {t.published_on} {dateFmt(article.published_at)}
        </div>
      ) : null}

      <article className="mag-content">
        <ReactMarkdown
          components={{
            // eslint-disable-next-line @next/next/no-img-element
            img: ({ src, alt }) => (
              <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className="mag-md-img" />
            ),
          }}
        >
          {article.content ?? ""}
        </ReactMarkdown>
      </article>

      <style>{`
        .mag-article { max-width: 760px; }
        .snapshot {
          margin-top: 14px;
          display: inline-block;
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid rgba(215,180,90,0.4);
          background: rgba(215,180,90,0.08);
          color: var(--gold2);
          font-size: 14px;
        }
        .mag-content {
          margin-top: 24px;
          line-height: 1.9;
          font-size: 17px;
          color: rgba(255,255,255,0.9);
        }
        .mag-content h1, .mag-content h2, .mag-content h3 {
          color: var(--gold2);
          margin: 28px 0 12px;
        }
        .mag-content a { color: var(--gold); text-decoration: underline; }
        .mag-content ul, .mag-content ol { padding-inline-start: 22px; }
        .mag-content li { margin: 6px 0; }
        .mag-content strong { color: #fff; }
        .mag-content blockquote {
          border-inline-start: 3px solid var(--gold);
          padding-inline-start: 14px;
          color: rgba(255,255,255,0.75);
          margin: 16px 0;
        }
        .mag-md-img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 18px auto;
          border-radius: 14px;
          border: 1px solid rgba(215,180,90,0.35);
        }
        .mag-tag {
          font-size: 12px;
          color: #111;
          background: linear-gradient(135deg, #f2d27b, #d7b45a);
          padding: 2px 10px;
          border-radius: 999px;
          font-weight: 600;
        }
        .mag-affects {
          font-size: 12px;
          color: var(--gold2);
          border: 1px solid rgba(215,180,90,0.5);
          padding: 2px 10px;
          border-radius: 999px;
        }
      `}</style>
    </main>
  );
}
