"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import type { Category } from "@/lib/types";
import type { Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { storefrontStorageKey } from "@/lib/site-content";
import { mapSupabaseProduct } from "@/lib/supabase-product";

const filters: Array<"Все" | Category> = [
  "Все",
  "Серьги",
  "Подвески",
  "Броши",
  "Браслеты",
  "Сувениры",
  "Для бизнеса",
];

const remoteCatalogConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
let cachedCatalogProducts: Product[] | null = null;

export function CatalogView() {
  return <Suspense fallback={<div className="catalog-loading">Загружаем каталог…</div>}><CatalogContent /></Suspense>;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection") ?? "";
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    () => cachedCatalogProducts ?? (remoteCatalogConfigured ? [] : products),
  );
  const [refreshing, setRefreshing] = useState(remoteCatalogConfigured && cachedCatalogProducts === null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [category, setCategory] = useState<(typeof filters)[number]>("Все");
  const [layout, setLayout] = useState<"editorial" | "grid">("grid");
  const filtered = useMemo(
    () =>
      catalogProducts.filter((product) =>
        (category === "Все" || product.category === category) &&
        (!collection || product.collection === collection || product.collection.startsWith(`${collection} ·`)),
      ),
    [catalogProducts, category, collection],
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const client = supabase;
    let active = true;
    let request = 0;
    async function refresh() {
      const current = ++request;
      setRefreshing(true);
      const { data, error } = await client.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("status", "published");
      if (!active || current !== request) return;
      if (!error && data) {
        const mappedProducts = data.map((row) => mapSupabaseProduct(row, products.find((item) => item.slug === row.slug)));
        cachedCatalogProducts = mappedProducts;
        setCatalogProducts(mappedProducts);
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
  }, []);

  return (
    <>
      <div className="catalog-heading">
        <h1>Каталог</h1>
      </div>
      {collection && <div className="catalog-collection"><span>{collection}</span><Link href="/catalog" aria-label="Сбросить фильтр коллекции">Все коллекции <span aria-hidden="true">×</span></Link></div>}

      <div className="catalog-controls">
        <div className="category-filter" aria-label="Фильтр по категориям">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={category === filter ? "active" : ""}
              aria-pressed={category === filter}
              onClick={() => setCategory(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="catalog-layout-switch" role="group" aria-label="Вид каталога">
          <button type="button" aria-label="Свободное расположение" title="Свободное расположение" aria-pressed={layout === "editorial"} onClick={() => setLayout("editorial")}>
            <svg aria-hidden="true" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="6" height="8" /><rect x="10.5" y="1.5" width="6" height="5" /><rect x="1.5" y="12" width="6" height="4.5" /><rect x="10.5" y="9" width="6" height="7.5" /></svg>
          </button>
          <button type="button" aria-label="Ровная сетка" title="Ровная сетка" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>
            <svg aria-hidden="true" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="6" height="6" /><rect x="10.5" y="1.5" width="6" height="6" /><rect x="1.5" y="10.5" width="6" height="6" /><rect x="10.5" y="10.5" width="6" height="6" /></svg>
          </button>
        </div>
      </div>

      <p className="sr-only" role="status">
        {refreshing && catalogProducts.length === 0
          ? "Загружаем актуальный каталог."
          : `${refreshing ? "Обновляем каталог. " : ""}Показано предметов: ${filtered.length}.${loadFailed ? " Не удалось обновить каталог." : ""}`}
      </p>
      <p className="catalog-result-note">{refreshing ? "Обновляем каталог…" : `Предметов: ${filtered.length}`}</p>
      {loadFailed && <p className="catalog-load-note">Не удалось обновить каталог.</p>}
      {refreshing && catalogProducts.length === 0 ? (
        <div className="catalog-loading" aria-hidden="true">Загружаем актуальный каталог…</div>
      ) : loadFailed && catalogProducts.length === 0 ? null : filtered.length === 0 ? (
        <div className="catalog-empty">
          <p>В этой категории пока нет товаров.</p>
          <Link className="text-link" href="/catalog" onClick={() => setCategory("Все")}>Показать весь каталог</Link>
        </div>
      ) : (
        <div aria-busy={refreshing} key={layout} className={`catalog-grid catalog-grid--${layout === "grid" ? "uniform" : "editorial"}`}>
          {filtered.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 2} quickAdd />
          ))}
        </div>
      )}
    </>
  );
}
