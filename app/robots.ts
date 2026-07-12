import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/owner", "/dashboard"],
    },
    sitemap: "https://goldary.vercel.app/sitemap.xml",
  };
}
