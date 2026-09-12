"use client";

import { useEffect, useState } from "react";
import { getPublishedArticles, type Article } from "@/app/lib/articles";
import { useT } from "@/app/lib/i18n";

const PREVIEW_COUNT = 3;

// معاينة أحدث المقالات في الصفحة الرئيسية — تجذب القرّاء للمجلة.
export default function MagazinePreview() {
  const { t } = useT();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublishedArticles().then((a) => {
      if (!mounted) return;
      setArticles(a.slice(0, PREVIEW_COUNT));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || articles.length === 0) return null;

  return (
    <section className="mp">
      <div className="row-between">
        <h2 className="title">{t.mag_latest}</h2>
        <a href="/magazine" className="btn-secondary">{t.mag_view_all}</a>
      </div>

      <div className="grid">
        {articles.map((a) => (
          <a key={a.id} href={`/magazine/${a.slug}`} className="card mp-card">
            {a.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.cover_image_url} alt={a.title} className="mp-cover" />
            ) : null}
            <div className="card-body">
              <span className="mp-tag">{t.categories[a.category]}</span>
              <div className="card-title" style={{ marginTop: 8 }}>{a.title}</div>
              {a.excerpt ? (
                <p className="muted small" style={{ marginTop: 6 }}>{a.excerpt}</p>
              ) : null}
            </div>
          </a>
        ))}
      </div>

      <style jsx>{`
        .mp-card {
          display: block;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          padding: 0;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .mp-card:hover {
          border-color: rgba(215, 180, 90, 0.55);
          transform: translateY(-2px);
        }
        .mp-cover {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-bottom: 1px solid rgba(215, 180, 90, 0.25);
        }
        .mp-tag {
          display: inline-block;
          font-size: 11px;
          padding: 2px 10px;
          border-radius: 999px;
          background: rgba(215, 180, 90, 0.15);
          color: var(--gold2);
        }
      `}</style>
    </section>
  );
}
