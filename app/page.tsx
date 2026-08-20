"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { CollectionShowcase, type HomeCollection } from "@/components/collection-showcase";
import { ProductCard } from "@/components/product-card";
import { heroImage, products, silverImage, woodImage } from "@/lib/products";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mapSupabaseProduct } from "@/lib/supabase-product";
import { assetPath } from "@/lib/asset-path";

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
    products: products.filter((product) => !product.collection.startsWith("В ритме Амура") && !product.collection.startsWith("Сэвэны")),
  },
];
const featuredFallbacks = products.filter((product) => product.orderable).slice(0, 5);

export default function HomePage() {
  const [blocks, setBlocks] = useState<Record<string, Record<string, unknown>>>({});
  const [liveCollections, setLiveCollections] = useState<HomeCollection[]>(collectionFallbacks);
  const [liveFeatured, setLiveFeatured] = useState<ReturnType<typeof mapSupabaseProduct>[]>(featuredFallbacks);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void Promise.all([
      supabase.from("site_content").select("key,content").eq("published", true),
      supabase.from("collections").select("id,slug,name,description,hero_image_url,sort_order").eq("published", true).order("sort_order"),
      supabase.from("products").select("slug,name,subtitle,description,price,orderable,featured,stock_quantity,material,wood_type,metal,dimensions,care,collection_id,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("status", "published"),
    ]).then(([contentResult, collectionResult, productResult]) => {
      if (contentResult.data) setBlocks(Object.fromEntries(contentResult.data.map((row) => [row.key, row.content as Record<string, unknown>])));
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
        setLiveCollections(collectionResult.data.map((collection, index) => ({
          id: collection.id,
          slug: collection.slug,
          name: collection.name,
          description: collection.description ?? "",
          heroImage: collection.hero_image_url || collectionFallbacks[index]?.heroImage || heroImage,
          products: mappedProducts.filter((item) => item.collectionId === collection.id).map((item) => item.product),
        })));
      }
    });
  }, []);
  const text = (key: string, field: string, fallback: string) => typeof blocks[key]?.[field] === "string" ? String(blocks[key][field]) : fallback;
  return (
    <main id="main-content">
      <section className="hero">
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
          <h1 className="sr-only">JE TIKI — украшения из дерева с берегов Амура</h1>
          <p className="hero-tagline">Украшения из дерева с берегов Амура</p>
          <Link className="hero-link" href="/catalog">
            Перейти в каталог <ArrowIcon className="arrow-icon" />
          </Link>
        </div>
      </section>

      <section className="home-intro section-shell" aria-labelledby="home-intro-title">
        <p className="eyebrow">О JE TIKI</p>
        <div className="home-intro-grid">
          <h2 id="home-intro-title">{text("home_intro", "title", "Современные предметы, в которых слышен Дальний Восток.")}</h2>
          <div>
            <p>{text("home_intro", "paragraph1", "Мы работаем с японским вязом и другими дальневосточными породами. Сохраняем рисунок дерева — он делает каждую вещь единственной.")}</p>
            <p>{text("home_intro", "paragraph2", "Источники форм — нанайский орнамент, природа Приамурья и простая геометрия.")}</p>
          </div>
        </div>
      </section>

      <section className="collection-stories" aria-labelledby="collections-title">
        <div className="collection-heading section-shell">
          <p className="eyebrow">Три истории</p>
          <h2 id="collections-title">Коллекции</h2>
        </div>
        <div className="collection-list">
          {liveCollections.map((collection) => (
            <CollectionShowcase collection={collection} key={collection.id} />
          ))}
        </div>
      </section>

      <section className="featured section-shell" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Выбор мастерской</p>
            <h2 id="featured-title">Предметы</h2>
          </div>
          <Link className="text-link" href="/catalog">Весь каталог</Link>
        </div>
        <div className="featured-grid">
          {liveFeatured.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className="city-wood" aria-labelledby="city-wood-title">
        <div className="city-wood-visual">
          <Image src={woodImage} alt="Предметы JE TIKI из древесины японского вяза" fill sizes="(max-width: 800px) 100vw, 48vw" />
          <span>Дерево города / новая форма</span>
        </div>
        <div className="city-wood-copy">
          <p className="eyebrow light">{text("city_wood", "eyebrow", "Материал с адресом")}</p>
          <h2 id="city-wood-title">{text("city_wood", "title", "Город продолжает жить в дереве.")}</h2>
          <p className="city-wood-lead">{text("city_wood", "text", "Часть материала JE TIKI — древесина японских вязов, которые удаляют в Хабаровске как аварийные деревья. Мы отбираем пригодные фрагменты и забираем их в мастерскую.")}</p>
          <p className="city-wood-note">{text("city_wood", "note", "Вместо того чтобы оказаться среди отходов, дерево получает новую форму — украшения и небольшие объекты, сделанные в том же городе, где оно росло.")}</p>
        </div>
      </section>

      <section className="about section-shell" id="about" aria-labelledby="about-title">
        <p className="eyebrow">Мастерская</p>
        <div className="about-grid">
          <h2 id="about-title">{text("about", "title", "JE TIKI создаёт украшения и небольшие объекты в Хабаровске.")}</h2>
          <div className="about-copy">
            <p>{text("about", "paragraph1", "Тёплые, тактильные вещи с локальным характером — для повседневной жизни, подарка и памяти о месте.")}</p>
            <p>{text("about", "paragraph2", "Кроме украшений мы создаём сувениры и небольшие серии для событий и бизнеса.")}</p>
            <Link className="text-link" href="/catalog">Смотреть все предметы</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
