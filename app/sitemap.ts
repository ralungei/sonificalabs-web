import type { MetadataRoute } from "next";

const BASE = "https://sonificalabs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/examples", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        es: `${BASE}${path}`,
        en: `${BASE}/en${path}`,
      },
    },
  }));
}
