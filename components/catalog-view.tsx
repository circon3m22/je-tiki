"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import type { Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { storefrontStorageKey } from "@/lib/site-content";
import { mapSupabaseProduct } from "@/lib/supabase-product";

const categoryOrder = ["Серьги", "Подвески", "Броши", "Браслеты", "Сувениры", "Для бизнеса"];
const byName = new Intl.Collator("ru");
const fallbackCollections = [
  { slug: "amur-rhythm", name: "В ритме Амура" },
  { slug: "seven-guardians", name: "Сэвэны-хранители" },
  { slug: "on-the-way", name: "На Пути" },
  { slug: "corporate", name: "Корпоративные сувениры" },
];
type CatalogCollection = { slug: string; name: string };
type Catalog = { products: Product[]; collections: CatalogCollection[] };
const fallbackCatalog = { products, collections: fallbackCollections };

function belongsTo(product: Product, collection: CatalogCollection) {
  if (product.collectionSlug) return product.collectionSlug === collection.slug;
  return product.collection === collection.name || product.collection.startsWith(`${collection.name} ·`);
}

const remoteCatalogConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
let cachedCatalog: Catalog | null = null;

export function CatalogView() {
  return <Suspense fallback={<div className="catalog-loading">Загружаем каталог…</div>}><CatalogContent /></Suspense>;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection") ?? "";
  const category = searchParams.get("category") ?? "";
  const groupByCollection = searchParams.get("sort") === "collection";
  const [catalog, setCatalog] = useState<Catalog | null>(() => cachedCatalog ?? (remoteCatalogConfigured ? null : fallbackCatalog));
  const [refreshing, setRefreshing] = useState(remoteCatalogConfigured && cachedCatalog === null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [layout, setLayout] = useState<"editorial" | "grid">("grid");
  const selectedCollection = catalog?.collections.find(({ slug, name }) => slug === collection || name === collection);
  const categories = useMemo(() => {
    const available = new Set<string>(catalog?.products.map((product) => product.category));
    return [...categoryOrder.filter((name) => available.delete(name)), ...Array.from(available).sort(byName.compare)];
  }, [catalog]);
  const filtered = useMemo(() => catalog?.products.filter((product) =>
    (!category || product.category === category) &&
    (!collection || (selectedCollection ? belongsTo(product, selectedCollection) : product.collection === collection)),
  ) ?? [], [catalog, category, collection, selectedCollection]);
  const groups = useMemo(() => {
    if (!groupByCollection || collection || !catalog) return [{ name: "", items: filtered }];
    const remaining = new Set(filtered);
    const result = catalog.collections.map((item) => {
      const items = filtered.filter((product) => belongsTo(product, item));
      items.forEach((product) => remaining.delete(product));
      return { name: item.name, items };
    });
    if (remaining.size) result.push({ name: "Другие изделия", items: [...remaining] });
    return result.filter(({ items }) => items.length);
  }, [catalog, collection, filtered, groupByCollection]);

  function updateQuery(values: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
  }

  const productQuery = new URLSearchParams();
  if (category) productQuery.set("category", category);
  if (collection) productQuery.set("collection", collection);
  if (groupByCollection) productQuery.set("sort", "collection");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const client = supabase;
    let active = true;
    let request = 0;
    async function refresh() {
      const current = ++request;
      setRefreshing(true);
      const [productResult, collectionResult] = await Promise.all([
        client.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("status", "published").order("slug"),
        client.from("collections").select("slug,name").eq("published", true).order("sort_order").order("slug"),
      ]);
      if (!active || current !== request) return;
      if (productResult.data && collectionResult.data) {
        cachedCatalog = {
          products: productResult.data.map((row) => mapSupabaseProduct(row, products.find((item) => item.slug === row.slug))),
          collections: collectionResult.data,
        };
        setCatalog(cachedCatalog);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
      setRefreshing(false);
    }

    function onStorage(event: StorageEvent) {
      if (event.key === storefrontStorageKey) void refresh();
    }

    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [retry]);

  return (
    <>
      <div className="catalog-heading">
        <h1>Каталог</h1>
        {selectedCollection && <p>{selectedCollection.name}</p>}
      </div>
      <div className="catalog-controls">
        <div className="category-filter" role="group" aria-label="Категории">
          <button type="button" aria-pressed={!category} onClick={() => updateQuery({ category: "" })}>Все категории</button>
          {categories.map((name) => (
            <button type="button" key={name} aria-pressed={category === name} onClick={() => updateQuery({ category: name })}>{name}</button>
          ))}
        </div>
        <div className="catalog-view-controls">
          <label className="catalog-select">
            <span>Коллекция</span>
            <select value={selectedCollection?.slug ?? collection} onChange={(event) => updateQuery({ collection: event.target.value })}>
              <option value="">Все коллекции</option>
              {collection && !selectedCollection && <option value={collection}>{collection}</option>}
              {catalog?.collections.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
          <label className="catalog-select">
            <span>Порядок</span>
            <select value={groupByCollection ? "collection" : ""} onChange={(event) => updateQuery({ sort: event.target.value })}>
              <option value="">Обычный</option>
              <option value="collection">По коллекциям</option>
            </select>
          </label>
          <div className="catalog-layout-switch" role="group" aria-label="Вид каталога">
            <button type="button" aria-label="Свободное расположение" title="Свободное расположение" aria-pressed={layout === "editorial"} onClick={() => setLayout("editorial")}>
              <svg aria-hidden="true" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="6" height="8" /><rect x="10.5" y="1.5" width="6" height="5" /><rect x="1.5" y="12" width="6" height="4.5" /><rect x="10.5" y="9" width="6" height="7.5" /></svg>
            </button>
            <button type="button" aria-label="Ровная сетка" title="Ровная сетка" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>
              <svg aria-hidden="true" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="6" height="6" /><rect x="10.5" y="1.5" width="6" height="6" /><rect x="1.5" y="10.5" width="6" height="6" /><rect x="10.5" y="10.5" width="6" height="6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="catalog-results" aria-busy={refreshing}>
        {loadFailed && (
          <div className="catalog-load-note" role="status">
            <p>{catalog ? "Не удалось обновить каталог. Показана предыдущая версия." : "Каталог временно недоступен."}</p>
            <button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>Повторить</button>
          </div>
        )}
        {refreshing && !catalog ? (
          <p className="catalog-loading" role="status">Загружаем каталог…</p>
        ) : catalog && (
          <>
            <p className="catalog-result-note" role="status">Предметов: {filtered.length}</p>
            {filtered.length === 0 ? (
              <div className="catalog-empty">
                <p>{category || collection ? "По выбранным фильтрам ничего не найдено." : "В каталоге пока нет изделий."}</p>
                {(category || collection) && <button type="button" className="secondary-button" onClick={() => updateQuery({ category: "", collection: "" })}>Сбросить фильтры</button>}
              </div>
            ) : groups.map(({ name, items }, groupIndex) => (
              <div className="catalog-group" key={name}>
                {name && <h2>{name}</h2>}
                <div className={`catalog-grid catalog-grid--${layout === "grid" ? "uniform" : "editorial"}`}>
                  {items.map((product, index) => (
                    <ProductCard key={product.slug} product={product} priority={groupIndex === 0 && index < 2} quickAdd catalogQuery={productQuery.toString()} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
