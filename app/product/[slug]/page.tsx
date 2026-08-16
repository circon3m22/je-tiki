import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Box, PackageCheck, Truck } from "lucide-react";
import { AddToCartPanel } from "@/components/add-to-cart-panel";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { RecentlyViewed } from "@/components/recently-viewed";
import {
  categories,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
} from "@/lib/catalog";
import { SITE_CONFIG } from "@/lib/config/site";
import {
  formatPrice,
  formatProductAvailability,
  formatSku,
  formatWeight,
} from "@/lib/formatters";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      url: `/product/${product.slug}`,
      images: product.images
        .slice(0, 2)
        .map((image) => ({ url: image.src, alt: image.alt })),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);
  const category = categories.find((entry) => entry.slug === product.category)!;
  const availability = formatProductAvailability(product);
  const productJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    material: product.materials.join(", "),
    image: product.images.map((image) =>
      new URL(image.src, SITE_CONFIG.seo.siteUrl).toString(),
    ),
    brand: { "@type": "Brand", name: SITE_CONFIG.brand.name },
    offers: {
      "@type": "Offer",
      url: `${SITE_CONFIG.seo.siteUrl}/product/${product.slug}`,
      priceCurrency: "RUB",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
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
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${SITE_CONFIG.seo.siteUrl}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Каталог", href: "/catalog" },
          { label: category.name, href: `/catalog/${category.slug}` },
          { label: product.name },
        ]}
      />
      <article className="site-container pb-20 pt-3 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.72fr] lg:gap-16 xl:gap-24">
          <ProductGallery images={product.images} name={product.name} />
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="flex flex-wrap gap-2">
              {product.isNew ? (
                <span className="product-badge border border-black/10">
                  Новинка
                </span>
              ) : null}
              {product.isBestseller ? (
                <span className="product-badge border border-black/10">
                  Бестселлер
                </span>
              ) : null}
            </div>
            <p className="eyebrow mt-5 text-stone-500">
              {category.singularName}
            </p>
            <h1 className="mt-3 font-display text-[clamp(3.2rem,5vw,5.8rem)] leading-[0.92] tracking-[-0.04em]">
              {product.name}
            </h1>
            <div className="mt-6 flex items-center gap-3">
              <p className="text-xl">{formatPrice(product.price)}</p>
              {product.oldPrice ? (
                <p className="text-sm text-stone-400 line-through">
                  {formatPrice(product.oldPrice)}
                </p>
              ) : null}
            </div>
            <p
              className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] ${product.stock > 0 ? "text-[#536650]" : "text-stone-500"}`}
            >
              {availability}
            </p>
            <p className="mt-7 text-sm leading-7 text-stone-600">
              {product.shortDescription}
            </p>
            <div className="mt-8">
              <AddToCartPanel product={product} />
            </div>
            {product.wildberriesUrl ? (
              <a
                href={product.wildberriesUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex min-h-12 items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
              >
                Купить на Wildberries
                <ArrowUpRight size={14} />
              </a>
            ) : null}
            <p className="mt-6 border-l border-[#536650] pl-4 text-xs leading-6 text-stone-600">
              {SITE_CONFIG.naturalMaterialNotice}
            </p>
            <div className="mt-8 grid grid-cols-3 border-y border-black/10 py-5 text-center">
              <div className="px-2">
                <Truck size={20} strokeWidth={1.3} className="mx-auto mb-2" />
                <p className="text-[9px] uppercase tracking-[0.13em]">
                  Доставка по России
                </p>
              </div>
              <div className="border-x border-black/10 px-2">
                <Box size={20} strokeWidth={1.3} className="mx-auto mb-2" />
                <p className="text-[9px] uppercase tracking-[0.13em]">
                  Подарочная коробка
                </p>
              </div>
              <div className="px-2">
                <PackageCheck
                  size={20}
                  strokeWidth={1.3}
                  className="mx-auto mb-2"
                />
                <p className="text-[9px] uppercase tracking-[0.13em]">
                  Проверка вручную
                </p>
              </div>
            </div>
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <dt className="text-stone-500">Материалы</dt>
                <dd className="mt-1">{product.materials.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Размер</dt>
                <dd className="mt-1">{product.dimensions}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Вес</dt>
                <dd className="mt-1">{formatWeight(product.weight)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Крепление</dt>
                <dd className="mt-1">
                  {product.fastening ?? "Не предусмотрено"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Порода дерева</dt>
                <dd className="mt-1">
                  {product.woodType ?? "Указана в партии"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Артикул</dt>
                <dd className="mt-1">{formatSku(product.sku)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-16 grid gap-12 border-t border-black/10 pt-12 lg:mt-28 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:pt-20">
          <div>
            <p className="eyebrow text-stone-500">Об изделии</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">
              Форма и материал
            </h2>
          </div>
          <div className="max-w-2xl text-base leading-8 text-stone-600">
            <p>{product.description}</p>
            <details className="mt-10 border-t border-black/10 py-5" open>
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
                Уход за изделием
              </summary>
              <ul className="mt-5 space-y-2 pl-4 text-sm leading-6">
                {product.care.map((item) => (
                  <li key={item} className="list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </details>
            <details className="border-t border-black/10 py-5">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
                Доставка и изготовление
              </summary>
              <p className="mt-5 text-sm leading-6">
                {SITE_CONFIG.delivery.notice} Срок изготовления этой модели:{" "}
                {product.productionTime}.
              </p>
            </details>
            <details className="border-y border-black/10 py-5">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
                Упаковка
              </summary>
              <p className="mt-5 text-sm leading-6">
                {SITE_CONFIG.packaging.description} Внутри также будет карточка
                с рекомендациями по уходу.
              </p>
            </details>
          </div>
        </div>
      </article>

      <section className="border-y border-black/10 bg-[#eee8dd] py-16 sm:py-24">
        <div className="site-container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow mb-4 text-stone-500">Продолжить выбор</p>
              <h2 className="font-display text-4xl sm:text-5xl">
                Похожие изделия
              </h2>
            </div>
            <Link
              href={`/catalog/${category.slug}`}
              className="nav-link hidden sm:block"
            >
              Вся категория
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-4 sm:gap-x-5">
            {related.map((entry) => (
              <ProductCard product={entry} key={entry.id} />
            ))}
          </div>
        </div>
      </section>
      <RecentlyViewed currentSlug={product.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
    </>
  );
}
