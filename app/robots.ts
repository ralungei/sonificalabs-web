import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/preview", "/api/", "/signin", "/account", "/audio", "/p/"],
    },
    sitemap: "https://sonificalabs.com/sitemap.xml",
  };
}
