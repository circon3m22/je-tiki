import type { MetadataRoute } from "next";
import { categories, getProducts } from "@/lib/catalog";
import { SITE_CONFIG } from "@/lib/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const staticPaths = [
    "",
    "/catalog",
    "/about",
    "/materials",
    "/delivery",
    "/care",
    "/contacts",
    "/offer",
    "/privacy",
    "/returns",
  ];
  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_CONFIG.seo.siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency:
        path === "" || path === "/catalog"
          ? ("weekly" as const)
          : ("monthly" as const),
      priority: path === "" ? 1 : path === "/catalog" ? 0.9 : 0.6,
    })),
    ...categories.map((category) => ({
      url: `${SITE_CONFIG.seo.siteUrl}/catalog/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${SITE_CONFIG.seo.siteUrl}/product/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images
        .slice(0, 1)
        .map((image) => `${SITE_CONFIG.seo.siteUrl}${image.src}`),
    })),
  ];
}
