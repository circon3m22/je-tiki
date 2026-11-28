"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/icons";
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
  return (
    <main id="main-content" className={hero ? undefined : "home-without-hero"}>
      {hero && <section className="hero">
        <Image
          src={assetPath("/images/je-tiki/amur-hero-new.webp")}
          alt="Амур под облачным небом"
          fill
          priority
          sizes="100vw"
          className="hero-image hero-image--parallax"
        />
        <div className="hero-shade" />
        <div className="hero-copy hero-copy--centered">
          {hero.eyebrow && <p className="eyebrow light">{hero.eyebrow}</p>}
          <h1 className="hero-tagline">{hero.title || "JE TIKI"}</h1>
          {hero.intro && <p className="hero-intro">{hero.intro}</p>}
          {hero.cta && <Link className="hero-link" href="/catalog">
            {hero.cta} <ArrowIcon className="arrow-icon" />
          </Link>}
        </div>
      </section>}

      {intro && <section className="home-intro section-shell" aria-labelledby="home-intro-title">
        {intro.eyebrow && <p className="eyebrow">{intro.eyebrow}</p>}
        <div className="home-intro-grid" data-reveal>
          <h2 id="home-intro-title">{intro.title}</h2>
          <div>
            {intro.paragraph1 && <p>{intro.paragraph1}</p>}
            {intro.paragraph2 && <p>{intro.paragraph2}</p>}
            {about && <Link className="text-link" href="#about">Знакомство с мастерской <ArrowIcon className="arrow-icon" /></Link>}
          </div>
        </div>
      </section>}

      {liveCollections.length > 0 && <section className="collection-stories" aria-labelledby="collections-title">
        <div className="collection-heading section-shell" data-reveal>
          <h2 id="collections-title">Коллекции</h2>
        </div>
        <div className="collection-list">
          {liveCollections.map((collection, index) => (
            <CollectionShowcase collection={collection} index={index} key={collection.id} />
          ))}
        </div>
      </section>}

      {liveFeatured.length > 0 && <section className="featured section-shell" aria-labelledby="featured-title">
        <div className="section-heading" data-reveal>
          <div>
            <h2 id="featured-title">Предметы</h2>
          </div>
          <Link className="text-link" href="/catalog">Весь каталог <ArrowIcon className="arrow-icon" /></Link>
        </div>
        <div className="featured-grid">
          {liveFeatured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>}

      {about && <section className="about" id="about" aria-labelledby="about-title">
        <div className="about-shell section-shell">
          {about.eyebrow && <p className="eyebrow">{about.eyebrow}</p>}
          <div className="about-grid" data-reveal>
            <h2 id="about-title">{about.title}</h2>
            <div className="about-copy">
              {about.paragraph1 && <p>{about.paragraph1}</p>}
              {about.paragraph2 && <p>{about.paragraph2}</p>}
              <Link className="text-link" href="/catalog">Смотреть все предметы</Link>
            </div>
          </div>
        </div>
      </section>}
    </main>
  );
}
