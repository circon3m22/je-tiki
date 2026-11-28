"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CollectionShowcase, type HomeCollection } from "@/components/collection-showcase";
import { useSiteContent } from "@/components/site-content-provider";
import { ProductCard } from "@/components/product-card";
import { heroImage, products, silverImage, woodImage } from "@/lib/products";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mapSupabaseProduct } from "@/lib/supabase-product";
import { assetPath, storefrontImageUrl } from "@/lib/asset-path";

const collectionFallbacks: HomeCollection[] = [
  {
    id: "fallback-amur",
    slug: "amur-rhythm",
    name: "В ритме Амура",
    description:
      "Ритм великой реки, таёжная свобода и знаки народов Приамурья. Спирали, рыбы, лодки и природные силуэты превращаются в лёгкие украшения из дерева.",
    heroImage,
    products: products.filter((product) => product.collection.startsWith("В ритме Амура")),
  },
  {
    id: "fallback-guardians",
    slug: "seven-guardians",
    name: "Сэвэны-хранители",
    description:
      "Антропоморфные и зооморфные образы, вдохновлённые культовой скульптурой Приамурья. Тигр, ящерица, птица и Дюли — хранитель домашнего очага.",
    heroImage: woodImage,
    products: products.filter((product) => product.collection.startsWith("Сэвэны")),
  },
  {
    id: "fallback-path",
    slug: "on-the-way",
    name: "На Пути",
    description:
      "Миниатюрные браслеты, пуссеты и подвески. Круг, треугольник и крест сохраняют естественный рисунок древесины и оставляют место личному смыслу.",
    heroImage: silverImage,
    products: products.filter((product) => product.collection === "На Пути"),
  },
];
const featuredFallbacks = products.filter((product) => product.orderable).slice(0, 5);

export function HomePage() {
  const hero = useSiteContent("hero");
  const intro = useSiteContent("home_intro");
  const about = useSiteContent("about");
  const [liveCollections, setLiveCollections] = useState<HomeCollection[]>(collectionFallbacks);
  const [liveFeatured, setLiveFeatured] = useState<ReturnType<typeof mapSupabaseProduct>[]>(featuredFallbacks);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void Promise.all([
      supabase.from("collections").select("id,slug,name,description,hero_image_url,sort_order").eq("published", true).order("sort_order"),
      supabase.from("products").select("slug,name,subtitle,description,price,orderable,featured,stock_quantity,material,wood_type,metal,dimensions,care,collection_id,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("status", "published"),
    ]).then(([collectionResult, productResult]) => {
      const mappedProducts = (productResult.data ?? []).map((row) => ({
        collectionId: row.collection_id,
        featured: row.featured,
        product: mapSupabaseProduct(row, products.find((product) => product.slug === row.slug)),
      }));
      if (!productResult.error && productResult.data) {
        const featured = mappedProducts.filter((item) => item.featured).map((item) => item.product).slice(0, 5);
        setLiveFeatured(featured);
      }
      if (!collectionResult.error && !productResult.error && collectionResult.data) {
        setLiveCollections(collectionResult.data.map((collection) => ({
          id: collection.id,
          slug: collection.slug,
          name: collection.name,
          description: collection.description ?? "",
          heroImage: collection.hero_image_url ? storefrontImageUrl(collection.hero_image_url) : (collectionFallbacks.find(({ slug }) => slug === collection.slug)?.heroImage ?? heroImage),
          products: mappedProducts.filter((item) => item.collectionId === collection.id).map((item) => item.product),
        })));
      }
    });
  }, []);
  const heroProduct = liveFeatured.find((item) => item.image);

  return (
    <main id="main-content">
      {hero && (
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
            <h1 id="hero-title">{hero.title || "JE TIKI"}</h1>
            {hero.intro && <p className="hero-intro">{hero.intro}</p>}
            {hero.cta && <Link className="primary-button hero-link" href="/catalog/">{hero.cta}</Link>}
          </div>
          <div className="hero-media">
            <Image src={assetPath("/images/je-tiki/amur-hero-new.webp")} alt="Амур под облачным небом"
              fill priority sizes="(max-width: 768px) 100vw, 55vw" className="hero-image" />
            {heroProduct?.image && (
              <div className="hero-product">
                <Image src={heroProduct.image} alt={heroProduct.name} fill sizes="(max-width: 768px) 30vw, 16vw" />
              </div>
            )}
          </div>
        </section>
      )}

      {liveFeatured.length > 0 && (
        <section className="featured section-shell" aria-labelledby="featured-title">
          <div className="section-heading">
            <h2 id="featured-title">Изделия</h2>
            <Link className="text-link" href="/catalog/">Весь каталог</Link>
          </div>
          <div className="featured-grid">
            {liveFeatured.map((product) => <ProductCard key={product.slug} product={product} quickAdd />)}
          </div>
        </section>
      )}

      {intro && (
        <section className="home-intro" aria-labelledby="home-intro-title">
          <div className="home-intro-grid section-shell">
            <div>
              {intro.eyebrow && <p className="eyebrow">{intro.eyebrow}</p>}
              <h2 id="home-intro-title">{intro.title}</h2>
            </div>
            <div className="story-copy">
              {intro.paragraph1 && <p>{intro.paragraph1}</p>}
              {intro.paragraph2 && <p>{intro.paragraph2}</p>}
              {about && <Link className="text-link" href="#about">Знакомство с мастерской</Link>}
            </div>
          </div>
        </section>
      )}

      {liveCollections.length > 0 && (
        <section className="collection-stories section-shell" aria-labelledby="collections-title">
          <div className="section-heading"><h2 id="collections-title">Коллекции</h2></div>
          <div className="collection-list">
            {liveCollections.map((collection) => <CollectionShowcase collection={collection} key={collection.id} />)}
          </div>
        </section>
      )}

      {about && (
        <section className="about" id="about" aria-labelledby="about-title">
          <div className="about-grid section-shell">
            <div>
              {about.eyebrow && <p className="eyebrow">{about.eyebrow}</p>}
              <h2 id="about-title">{about.title}</h2>
            </div>
            <div className="story-copy">
              {about.paragraph1 && <p>{about.paragraph1}</p>}
              {about.paragraph2 && <p>{about.paragraph2}</p>}
              <Link className="text-link" href="/catalog/">Смотреть все изделия</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
