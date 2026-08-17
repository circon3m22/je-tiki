import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./sterile.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_CONFIG } from "@/lib/config/site";

const manrope = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    {
      path: "./fonts/manrope-cyrillic-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
    {
      path: "./fonts/manrope-latin-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.seo.siteUrl),
  title: {
    default: SITE_CONFIG.seo.title,
    template: SITE_CONFIG.seo.titleTemplate,
  },
  description: SITE_CONFIG.seo.description,
  applicationName: SITE_CONFIG.brand.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_CONFIG.brand.name,
    title: SITE_CONFIG.seo.title,
    description: SITE_CONFIG.seo.description,
    url: "/",
    images: [
      {
        url: SITE_CONFIG.seo.defaultOgImage,
        alt: "Je Tiki — украшения из дерева и серебра",
      },
    ],
  },
  twitter: {
    card: SITE_CONFIG.seo.twitterCard,
    title: SITE_CONFIG.seo.title,
    description: SITE_CONFIG.seo.description,
    images: [SITE_CONFIG.seo.defaultOgImage],
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfbfa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.brand.name,
    url: SITE_CONFIG.seo.siteUrl,
    logo: `${SITE_CONFIG.seo.siteUrl}/brand/je-tiki-logo-dark.webp`,
    description: SITE_CONFIG.brand.description,
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.brand.name,
    url: SITE_CONFIG.seo.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_CONFIG.seo.siteUrl}/catalog?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ru">
      <body className={manrope.variable}>
        <a href="#main-content" className="skip-link">
          Перейти к содержимому
        </a>
        <Providers>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
        />
      </body>
    </html>
  );
}
