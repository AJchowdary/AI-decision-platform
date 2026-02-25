// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/decision-cards", "/report/", "/ingestion", "/insights/", "/settings", "/login", "/signup"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/decision-cards", "/report/", "/ingestion", "/insights/", "/settings", "/login", "/signup"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/decision-cards", "/report/", "/ingestion", "/insights/", "/settings", "/login", "/signup"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
