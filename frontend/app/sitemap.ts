// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];
  return routes.map((r) => ({
    url: r.url,
    lastModified: r.lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
