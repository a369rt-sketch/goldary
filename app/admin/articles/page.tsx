"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/app/lib/i18n";
import { useAuthRole, authFetch } from "@/app/lib/useAuth";

type ArticleStatus = "draft" | "pending" | "approved" | "rejected";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  author_name: string | null;
  status: ArticleStatus;
  created_at: string;
  cover_image_url: string | null;
};

export default function AdminArticlesPage() {
  const router = useRouter();
  const { t, dir, lang } = useT();
  const { loading, userId, isAdmin } = useAuthRole();

  const [articles, setArticles] = useState<Article[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await authFetch("/api/magazine/articles", { cache: "no-store" });
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch (e) {
      console.error("Load failed:", e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace("/owner/login");
      return;
    }
    if (isAdmin) load();
  }, [loading, userId, isAdmin, load, router]);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await authFetch("/api/magazine/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) await load();
    } catch (e) {
      console.error("Action failed:", e);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">{t.access_checking}</p>
      </main>
    );
  }
  if (userId && !isAdmin) {
    return (
      <main className="container">
        <p className="error">{t.access_denied}</p>
        <a href="/" className="btn-secondary" style={{ marginTop: 12 }}>
          {t.home}
        </a>
      </main>
    );
  }
  if (!userId) return null; // يُعاد توجيهه لصفحة الدخول

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en");

  const pending = articles.filter((a) => a.status === "pending");
  const published = articles.filter((a) => a.status === "approved");

  const Card = ({ a, actions }: { a: Article; actions: boolean }) => (
    <div
      className="card"
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
        {a.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.cover_image_url}
            alt=""
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid rgba(215,180,90,0.3)",
              flexShrink: 0,
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <strong style={{ color: "var(--gold2)" }}>{a.title}</strong>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {t.categories[a.category as keyof typeof t.categories] ?? a.category}
            {a.author_name ? ` · ${t.by_author} ${a.author_name}` : ""} ·{" "}
            {dateFmt(a.created_at)}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <a href={`/magazine/${a.slug}`} className="btn-secondary small-btn">
          {t.view}
        </a>
        {actions && (
          <>
            <button
              type="button"
              onClick={() => act(a.id, "approve")}
              disabled={busy === a.id}
              style={{
                background: "rgba(60,180,90,0.15)",
                color: "#43c66a",
                border: "1px solid rgba(60,180,90,0.4)",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {busy === a.id ? "..." : t.approve}
            </button>
            <button
              type="button"
              onClick={() => act(a.id, "reject")}
              disabled={busy === a.id}
              style={{
                background: "rgba(220,60,60,0.12)",
                color: "#e66",
                border: "1px solid rgba(220,60,60,0.4)",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {t.reject}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <main className="container" dir={dir}>
      <div className="row-between">
        <h1 className="title">{t.admin_articles}</h1>
        <a href="/admin" className="btn-secondary">
          {t.back}
        </a>
      </div>

      {/* بانتظار الموافقة */}
      <h2 className="h2" style={{ marginTop: 24 }}>
        {t.admin_pending} ({pending.length})
      </h2>
      {dataLoading ? (
        <p className="muted">{t.loading}</p>
      ) : pending.length === 0 ? (
        <p className="muted">{t.no_pending}</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pending.map((a) => (
            <Card key={a.id} a={a} actions />
          ))}
        </div>
      )}

      {/* المنشورة */}
      <h2 className="h2" style={{ marginTop: 32 }}>
        {t.admin_published} ({published.length})
      </h2>
      {!dataLoading && published.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {published.map((a) => (
            <Card key={a.id} a={a} actions={false} />
          ))}
        </div>
      )}
    </main>
  );
}
