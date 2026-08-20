"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import type { Category } from "@/lib/types";
import type { Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
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
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    () => cachedCatalogProducts ?? (remoteCatalogConfigured ? [] : products),
  );
  const [refreshing, setRefreshing] = useState(remoteCatalogConfigured && cachedCatalogProducts === null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [category, setCategory] = useState<(typeof filters)[number]>("Все");
  const [layout, setLayout] = useState<"editorial" | "grid">("grid");
  const filtered = useMemo(
    () =>
      category === "Все"
        ? catalogProducts
        : catalogProducts.filter((product) => product.category === category),
    [catalogProducts, category],
  );

  useEffect(() => {
    if (cachedCatalogProducts) {
      setCatalogProducts(cachedCatalogProducts);
      setRefreshing(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setCatalogProducts(products);
      setRefreshing(false);
      return;
    }
    let active = true;
    setRefreshing(true);
    void (async () => {
      const { data, error } = await supabase.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("status", "published");
      if (!active) return;
      if (!error && data) {
        const mappedProducts = data.map((row) => mapSupabaseProduct(row, products.find((item) => item.slug === row.slug)));
        cachedCatalogProducts = mappedProducts;
        setCatalogProducts(mappedProducts);
      } else if (error) {
        setCatalogProducts(products);
        setLoadFailed(true);
      }
      setRefreshing(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <>
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Коллекция 2026</p>
          <h1>Каталог</h1>
        </div>
      </div>

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
          : `${refreshing ? "Обновляем каталог. " : ""}Показано украшений: ${filtered.length}.${loadFailed ? " Не удалось обновить данные — показан сохранённый каталог." : ""}`}
      </p>
      {refreshing && catalogProducts.length === 0 ? (
        <div className="catalog-loading" aria-hidden="true">Загружаем актуальный каталог…</div>
      ) : filtered.length === 0 ? (
        <div className="catalog-empty">
          <p>В этой категории пока нет товаров.</p>
          <button type="button" className="text-link" onClick={() => setCategory("Все")}>Показать весь каталог</button>
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
