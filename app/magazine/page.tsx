"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPublishedArticles,
  type Article,
  type ArticleCategory,
} from "@/app/lib/articles";
import { useT } from "@/app/lib/i18n";
import MagazineHeader from "./MagazineHeader";
import PriceBar from "./PriceBar";
import ArticleEditor from "./ArticleEditor";

type Tab = "all" | ArticleCategory;
const TAB_KEYS: Tab[] = ["all", "news", "analysis", "learn", "investment", "markets"];

// عتبة تمييز "المقال الطويل" (غلاف مصمم) عن "الخبر القصير" حين لا توجد صورة
const LONG_CONTENT_CHARS = 600;

type Shape = "image" | "cover" | "short";
function shapeOf(a: Article): Shape {
  if (a.cover_image_url) return "image";
  if ((a.content ?? "").length > LONG_CONTENT_CHARS) return "cover";
  return "short";
}

// إظهار ناعم عند التمرير لكل عناصر .mag-reveal داخل الحاوية
function useReveal<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".mag-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
  return ref;
}

export default function MagazinePage() {
  const { t, lang, dir } = useT();
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

  // خبر اليوم: أحدث منشور تصنيفه "أخبار" (القائمة مرتّبة تنازلياً بالتاريخ)
  const newsToday = useMemo(
    () => articles.find((a) => a.category === "news") ?? null,
    [articles]
  );

  const listRef = useReveal<HTMLDivElement>(`${tab}:${filtered.length}`);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  return (
    <div className="mag-root" data-lang={lang} dir={dir}>
      <div className="mag-shell" style={{ paddingBottom: 110 }}>
        {/* ضوء ناعم يتحرك ببطء في الخلفية */}
        <div
          className="mag-drift"
          aria-hidden
          style={{
            position: "absolute",
            top: -120,
            insetInlineStart: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,250,240,0.35) 0%, rgba(255,250,240,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <MagazineHeader />

          {/* العنوان */}
          <div style={{ padding: "4px 20px 0", display: "flex", flexDirection: "column", gap: 4 }}>
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
              {t.mag_title}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: "#4A4238" }}>{t.mag_tagline}</p>
          </div>

          {/* تبويب الرئيسية / مقالاتي */}
          <div style={{ padding: "16px 20px 0" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                background: "rgba(255,255,255,0.28)",
                borderRadius: 999,
                padding: 4,
                width: 220,
              }}
            >
              <span
                style={{
                  borderRadius: 999,
                  padding: "10px 0",
                  background: "#6B5446",
                  color: "#F4EEE3",
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 44,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {t.home}
              </span>
              <a
                href="/magazine/my-articles"
                style={{
                  borderRadius: 999,
                  padding: "10px 0",
                  color: "#4E3C31",
                  fontSize: 14,
                  minHeight: 44,
                  display: "grid",
                  placeItems: "center",
                  textDecoration: "none",
                }}
              >
                {t.my_articles}
              </a>
            </div>
          </div>

          {/* شريط السعر */}
          <PriceBar />

          {/* خبر اليوم */}
          {newsToday && (
            <section
              aria-label={t.mag_news_today}
              style={{ padding: "26px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#4E3C31" }}>{t.mag_news_today}</span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--serif)",
                  fontWeight: 700,
                  fontSize: 32,
                  lineHeight: 1.4,
                  color: "#6B5446",
                }}
              >
                {newsToday.title}
              </h2>
              {newsToday.excerpt && (
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#2E2A25" }}>
                  {newsToday.excerpt}
                </p>
              )}
              <a
                href={`/magazine/${newsToday.slug}`}
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#4E3C31",
                  textDecoration: "none",
                  borderBottom: "1px solid #6B5446",
                }}
              >
                {t.mag_read_news}
              </a>
            </section>
          )}

          {/* شريط الأقسام */}
          <nav
            aria-label={t.nav_magazine}
            style={{
              marginTop: 22,
              padding: "0 20px",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              borderTop: "1px solid rgba(46,42,37,0.14)",
              borderBottom: "1px solid rgba(46,42,37,0.14)",
            }}
          >
            {TAB_KEYS.map((key) => {
              const on = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  style={{
                    flexShrink: 0,
                    border: 0,
                    background: "transparent",
                    padding: on ? "12px 4px" : "12px 8px",
                    minHeight: 44,
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: on ? 600 : 400,
                    color: on ? "#2E2A25" : "#4A4238",
                    borderBottom: on ? "2px solid #6B5446" : "2px solid transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key === "all" ? t.tab_all : t.categories[key]}
                </button>
              );
            })}
          </nav>

          {/* قائمة المنشورات */}
          <section
            ref={listRef}
            aria-label={t.mag_latest_posts}
            style={{ padding: "8px 20px 0", display: "flex", flexDirection: "column" }}
          >
            {loading ? (
              <p style={{ color: "#4A4238", padding: "18px 0" }}>{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: "#4A4238", padding: "18px 0" }}>{t.mag_empty}</p>
            ) : (
              filtered.map((a) => {
                const shape = shapeOf(a);
                const cat = t.categories[a.category];
                const date = fmtDate(a.published_at);
                const href = `/magazine/${a.slug}`;

                if (shape === "image") {
                  return (
                    <a
                      key={a.id}
                      href={href}
                      className="mag-reveal"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) 104px",
                        gap: 14,
                        alignItems: "center",
                        padding: "18px 0",
                        borderBottom: "1px solid rgba(46,42,37,0.14)",
                        textDecoration: "none",
                        color: "#2E2A25",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: "#4A4238" }}>
                          <span style={{ fontWeight: 600, color: "#4E3C31" }}>{cat}</span>
                          <span>{date}</span>
                        </div>
                        <h3
                          style={{
                            margin: 0,
                            fontFamily: "var(--serif)",
                            fontWeight: 700,
                            fontSize: 22,
                            lineHeight: 1.45,
                            color: "#6B5446",
                          }}
                        >
                          {a.title}
                        </h3>
                        {a.excerpt && (
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>{a.excerpt}</p>
                        )}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.cover_image_url!}
                        alt={a.title}
                        style={{
                          width: 104,
                          height: 104,
                          borderRadius: 12,
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  );
                }

                if (shape === "cover") {
                  return (
                    <a
                      key={a.id}
                      href={href}
                      className="mag-reveal"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        padding: "18px 0",
                        borderBottom: "1px solid rgba(46,42,37,0.14)",
                        textDecoration: "none",
                        color: "#2E2A25",
                      }}
                    >
                      <div
                        style={{
                          minHeight: 170,
                          borderRadius: 14,
                          background: "#4E3C31",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          padding: "22px 20px",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#E6D9C6" }}>{cat}</span>
                        <span
                          className="mag-shine-gold"
                          style={{
                            fontFamily: "var(--serif)",
                            fontWeight: 700,
                            fontSize: 32,
                            lineHeight: 1.35,
                          }}
                        >
                          {a.title}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#4A4238" }}>
                        <span style={{ fontWeight: 600, color: "#4E3C31" }}>{cat}</span>
                        <span>{date}</span>
                      </div>
                      {a.excerpt && (
                        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8 }}>{a.excerpt}</p>
                      )}
                    </a>
                  );
                }

                // short news
                return (
                  <a
                    key={a.id}
                    href={href}
                    className="mag-reveal"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: "18px 0",
                      borderBottom: "1px solid rgba(46,42,37,0.14)",
                      textDecoration: "none",
                      color: "#2E2A25",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: "#4A4238" }}>
                      <span style={{ fontWeight: 600, color: "#4E3C31" }}>{cat}</span>
                      <span>{date}</span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--serif)",
                        fontWeight: 700,
                        fontSize: 24,
                        lineHeight: 1.45,
                        color: "#6B5446",
                      }}
                    >
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>{a.excerpt}</p>
                    )}
                  </a>
                );
              })
            )}
          </section>
        </div>

        {/* الزر العائم "إرسال مقال" — يبقى كما هو من ArticleEditor */}
        <ArticleEditor />
      </div>
    </div>
  );
}
