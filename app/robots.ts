import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout", "/cart", "/order/"],
    },
    sitemap: `${SITE_CONFIG.seo.siteUrl}/sitemap.xml`,
    host: SITE_CONFIG.seo.siteUrl,
  };
}
