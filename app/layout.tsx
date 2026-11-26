import type { Metadata, Viewport } from "next";
import "@/app/fonts.css";
import "@/app/globals.css";
import { SiteShell } from "@/components/site-shell";
import { assetPath } from "@/lib/asset-path";
import { siteOrigin, siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "JE TIKI — украшения из дерева с берегов Амура", template: "%s — JE TIKI" },
  description: "Авторские украшения из японского вяза, вдохновлённые природой и культурой Приамурья. Небольшие тиражи и ручная работа.",
  icons: {
    icon: [
      { url: assetPath("/favicon-64.png"), type: "image/png", sizes: "64x64" },
      { url: assetPath("/icon-192.png"), type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: assetPath("/apple-touch-icon.png"), type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "JE TIKI",
    images: [{ url: siteUrl("/images/je-tiki/amur-hero-new.webp"), alt: "Амур под облачным небом" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
