import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { ProductOverlay } from "@/components/product-overlay";
import { getProduct, products } from "@/lib/products";

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
    alternates: { canonical: `/catalog/${product.slug}` },
    openGraph: product.image ? { images: [{ url: product.image }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return (
    <main id="main-content" className="catalog-page section-shell">
      <CatalogView />
      <ProductOverlay product={product} slug={slug} />
    </main>
  );
}
