'use client';

import { useCallback, useEffect, useState } from 'react';
import ArticleForm, {
  CATEGORIES,
  type ArticleCategory,
} from '../ArticleForm';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: ArticleCategory;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  published_at: string | null;
};

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<ArticleCategory, string>;

export default function MyArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/magazine/articles', { cache: 'no-store' });
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch (e) {
      console.error('Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (article: Article) => {
    if (!confirm(`حذف المقال "${article.title}"؟ لا يمكن التراجع.`)) return;
    setDeletingId(article.id);
    try {
      const res = await fetch(`/api/magazine/articles?id=${article.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        alert('فشل حذف المقال');
      }
    } catch (e) {
      console.error('Delete failed:', e);
      alert('خطأ في الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="container" dir="rtl">
      <div className="row-between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="title">مقالاتي</h1>
          <p className="muted">إدارة المقالات — مسودات ومنشورة</p>
        </div>
        <a href="/magazine" className="btn-secondary">
          ← المجلة
        </a>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 24 }}>
          جارٍ التحميل…
        </p>
      ) : articles.length === 0 ? (
        <div className="card" style={{ maxWidth: 520, marginTop: 24 }}>
          <p className="muted" style={{ margin: 0 }}>
            لا توجد مقالات بعد
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {articles.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                {a.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.cover_image_url}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '1px solid rgba(215,180,90,0.3)',
                      flexShrink: 0,
                    }}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--gold2, #d7b45a)' }}>{a.title}</strong>
                    <span
                      className="pill"
                      style={{
                        fontSize: 12,
                        background: a.published
                          ? 'rgba(60,180,90,0.15)'
                          : 'rgba(160,160,160,0.15)',
                        color: a.published ? '#43c66a' : '#9aa',
                        border: 'none',
                      }}
                    >
                      {a.published ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {CATEGORY_LABEL[a.category] ?? a.category} ·{' '}
                    {new Date(a.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditing(a)}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a)}
                  disabled={deletingId === a.id}
                  style={{
                    background: 'rgba(220,60,60,0.12)',
                    color: '#e66',
                    border: '1px solid rgba(220,60,60,0.4)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {deletingId === a.id ? '...' : 'حذف'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ArticleForm
          initial={{
            id: editing.id,
            title: editing.title,
            slug: editing.slug,
            excerpt: editing.excerpt ?? '',
            content: editing.content ?? '',
            category: editing.category,
            coverImageUrl: editing.cover_image_url,
            published: editing.published,
          }}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </main>
  );
}
