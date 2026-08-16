import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogClient } from "@/components/catalog-client";
import { categories, getCategory, getProductsByCategory } from "@/lib/catalog";
import { SITE_CONFIG } from "@/lib/config/site";
import type { ProductCategory } from "@/lib/types/catalog";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/catalog/${category.slug}` },
    openGraph: {
      title: `${category.name} — ${SITE_CONFIG.brand.name}`,
      description: category.description,
      url: `/catalog/${category.slug}`,
      images: [{ url: category.image, alt: category.imageAlt }],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = await getProductsByCategory(category.slug);
  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: SITE_CONFIG.seo.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: `${SITE_CONFIG.seo.siteUrl}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE_CONFIG.seo.siteUrl}/catalog/${category.slug}`,
      },
    ],
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Каталог", href: "/catalog" },
          { label: category.name },
        ]}
      />
      <header className="site-container pb-12 pt-8 sm:pb-16 sm:pt-14">
        <p className="eyebrow mb-5 text-stone-500">Категория</p>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <h1 className="display-title">{category.name}</h1>
          <p className="max-w-lg text-sm leading-7 text-stone-600 lg:justify-self-end">
            {category.description}
          </p>
        </div>
      </header>
      <CatalogClient
        products={products}
        initialCategory={category.slug as ProductCategory}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
    </>
  );
}
