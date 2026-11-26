import { assetPath } from "@/lib/asset-path";

export const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.NEXT_PUBLIC_BASE_PATH ? "https://circon3m22.github.io" : "https://jetiki.ru");

export function siteUrl(path: string) {
  return new URL(assetPath(path), siteOrigin).href;
}
