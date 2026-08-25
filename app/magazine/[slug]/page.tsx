import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/app/lib/articles";
import ArticleView from "./ArticleView";

// SEO ديناميكي من المقال
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Magazine" };

  const description = article.excerpt ?? undefined;
  return {
    title: article.title,
    description,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  // العرض في مكوّن عميل ليتبع اللغة/الاتجاه المختارَين
  return <ArticleView article={article} />;
}
