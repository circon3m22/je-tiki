import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/app/globals.css";
import { CartProvider } from "@/components/cart-provider";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { SiteShell } from "@/components/site-shell";
import { assetPath } from "@/lib/asset-path";

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-cormorant",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jetiki.ru"),
  title: { default: "JE TIKI — украшения из дерева с берегов Амура", template: "%s — JE TIKI" },
  description: "Авторские украшения из японского вяза, вдохновлённые природой и культурой Приамурья. Небольшие тиражи и ручная работа.",
  manifest: assetPath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JE TIKI",
  },
  icons: {
    icon: [
      { url: assetPath("/favicon-64.png"), type: "image/png", sizes: "64x64" },
      { url: assetPath("/icon-192.png"), type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: assetPath("/apple-touch-icon.png"), type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "JE TIKI — украшения из дерева с берегов Амура",
    description: "Тактильные украшения, созданные вручную.",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${display.variable}`}>
        <CartProvider>
          <PwaRegistrar />
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
