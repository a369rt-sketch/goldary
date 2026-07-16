"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getPublishedArticles,
  CATEGORY_LABELS,
  AFFECTS_META,
  type Article,
  type ArticleCategory,
} from "@/app/lib/articles";

type Tab = "all" | ArticleCategory;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "news", label: CATEGORY_LABELS.news },
  { key: "analysis", label: CATEGORY_LABELS.analysis },
  { key: "learn", label: CATEGORY_LABELS.learn },
  { key: "investment", label: CATEGORY_LABELS.investment },
  { key: "markets", label: CATEGORY_LABELS.markets },
];

export default function MagazinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    let alive = true;
    getPublishedArticles().then((data) => {
      if (!alive) return;
      setArticles(data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (tab === "all" ? articles : articles.filter((a) => a.category === tab)),
    [articles, tab]
  );

  return (
    <main className="container" dir="rtl">
      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 className="title">مجلة Goldary</h1>
          <p className="muted">أخبار وتحليلات الذهب والسوق في العراق</p>
        </div>
        <a href="/" className="btn-secondary">الرئيسية</a>
      </div>

      {/* تبويبات الأقسام */}
      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "pill active" : "pill"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 24 }}>جارٍ التحميل…</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ maxWidth: 520, marginTop: 24 }}>
          <p className="muted" style={{ margin: 0 }}>لا توجد مقالات في هذا القسم بعد</p>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 24 }}>
          {filtered.map((a) => {
            const affects = a.affects ? AFFECTS_META[a.affects] : null;
            return (
              <a key={a.id} href={`/magazine/${a.slug}`} className="card mag-card">
                {a.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.cover_image_url}
                    alt={a.title}
                    className="mag-cover"
                  />
                ) : null}
                <div className="card-body">
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span className="mag-tag">{CATEGORY_LABELS[a.category]}</span>
                    {affects ? (
                      <span className="mag-affects">
                        {affects.icon} {affects.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="card-title" style={{ marginTop: 8 }}>{a.title}</div>
                  {a.excerpt ? (
                    <p className="muted small" style={{ marginTop: 6 }}>{a.excerpt}</p>
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .mag-card {
          display: block;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .mag-card:hover {
          border-color: rgba(215, 180, 90, 0.55);
          transform: translateY(-2px);
        }
        .mag-cover {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-bottom: 1px solid rgba(215, 180, 90, 0.25);
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
          border: 1px solid rgba(215, 180, 90, 0.5);
          padding: 2px 10px;
          border-radius: 999px;
        }
      `}</style>
    </main>
  );
}
