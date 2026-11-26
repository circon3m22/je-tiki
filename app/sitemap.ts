import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/catalog/", "/legal/offer/", "/legal/privacy/", "/legal/personal-data/", "/legal/returns/"]
    .map((path) => ({ url: siteUrl(path) }));
}
