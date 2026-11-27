import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductOverlay } from "@/components/product-overlay";
import { getProduct, products } from "@/lib/products";

import { siteOrigin, siteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.subtitle}. ${product.description}`,
    alternates: { canonical: siteUrl(`/catalog/${product.slug}/`) },
    openGraph: product.image ? { locale: "ru_RU", siteName: "JE TIKI", images: [{ url: new URL(product.image, siteOrigin).href, alt: product.name }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return (
    <main id="main-content" className="product-page">
      <Suspense fallback={<div className="product-route-loading" role="status">Загружаем товар…</div>}><ProductOverlay product={product} slug={slug} /></Suspense>
    </main>
  );
}
