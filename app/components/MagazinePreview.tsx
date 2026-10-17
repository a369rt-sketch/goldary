"use client";

import { useEffect, useState } from "react";
import {
  getPublishedArticles,
  localizedArticle,
  displayExcerpt,
  type Article,
} from "@/app/lib/articles";
import { topCategories, readSlugs } from "@/app/lib/readingHistory";
import { useT } from "@/app/lib/i18n";

const PREVIEW_COUNT = 4;

// اختيار المقترحات حسب سجل قراءة الزائر (localStorage):
//  • رتّب مقالات التصنيفات الأكثر قراءة أولاً، واستبعد ما قرأه.
//  • زائر جديد بلا سجل → أحدث المقالات.
function pickForVisitor(all: Article[]): Article[] {
  const read = readSlugs();
  let pool = all.filter((a) => !read.has(a.slug));
  if (pool.length === 0) pool = all; // قرأ كل شيء → نعرض الأحدث

  const top = topCategories();
  if (top.length > 0) {
    const rank = new Map(top.map((c, i) => [c, i]));
    // sort ثابت في JS الحديث: التعادل يحافظ على ترتيب الأحدث أولاً
    pool = [...pool].sort((a, b) => {
      const ra = rank.has(a.category) ? (rank.get(a.category) as number) : Infinity;
      const rb = rank.has(b.category) ? (rank.get(b.category) as number) : Infinity;
      return ra - rb;
    });
  }
  return pool.slice(0, PREVIEW_COUNT);
}

// معاينة المقالات في الصفحة الرئيسية — مخصّصة لاهتمام الزائر، وتجذبه للمجلة.
export default function MagazinePreview() {
  const { t, lang } = useT();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublishedArticles().then((all) => {
      if (!mounted) return;
      // قراءة سجل localStorage تحدث هنا (عميل فقط) داخل try/catch في المساعِد
      setArticles(pickForVisitor(all));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || articles.length === 0) return null;

  // عنوان القسم: "مختارة لك" لو عنده سجل، وإلا "أحدث المقالات"
  const heading = topCategories().length > 0 ? t.mag_for_you : t.mag_latest;

  return (
    <section className="mp">
      <div className="row-between">
        <h2 className="title">{heading}</h2>
        <a href="/magazine" className="btn-secondary">{t.mag_view_all}</a>
      </div>

      <div className="grid">
        {articles.map((a) => {
          const loc = localizedArticle(a, lang);
          const excerpt = displayExcerpt(loc);
          return (
            <a key={a.id} href={`/magazine/${a.slug}`} className="card mp-card">
              {a.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.cover_image_url} alt={loc.title} className="mp-cover" />
              ) : null}
              <div className="card-body">
                <span className="mp-tag">{t.categories[a.category]}</span>
                <div className="card-title" style={{ marginTop: 8 }}>{loc.title}</div>
                {excerpt ? (
                  <p className="muted small" style={{ marginTop: 6 }}>{excerpt}</p>
                ) : null}
              </div>
            </a>
          );
        })}
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
