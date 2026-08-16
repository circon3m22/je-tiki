"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories, catalogMaterials } from "@/lib/catalog";
import type {
  CatalogSort,
  Product,
  ProductCategory,
} from "@/lib/types/catalog";

interface CatalogClientProps {
  products: readonly Product[];
  initialCategory?: ProductCategory;
  initialSearch?: string;
}

type Availability = "all" | "in-stock" | "made-to-order";

export function CatalogClient({
  products,
  initialCategory,
  initialSearch = "",
}: CatalogClientProps) {
  const [category, setCategory] = useState<ProductCategory | "all">(
    initialCategory ?? "all",
  );
  const [material, setMaterial] = useState("all");
  const [availability, setAvailability] = useState<Availability>("all");
  const [sort, setSort] = useState<CatalogSort>("featured");
  const [columns, setColumns] = useState<3 | 4>(4);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalizedSearch = initialSearch.trim().toLocaleLowerCase("ru-RU");
    const result = products.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (material !== "all" && !product.materials.includes(material))
        return false;
      if (availability === "in-stock" && product.stock <= 0) return false;
      if (availability === "made-to-order" && product.stock > 0) return false;
      if (normalizedSearch) {
        const value = [
          product.name,
          product.shortDescription,
          product.woodType ?? "",
          ...product.materials,
        ]
          .join(" ")
          .toLocaleLowerCase("ru-RU");
        if (!value.includes(normalizedSearch)) return false;
      }
      return true;
    });

    return result.sort((left, right) => {
      switch (sort) {
        case "price-asc":
          return left.price - right.price;
        case "price-desc":
          return right.price - left.price;
        case "newest":
          return Date.parse(right.createdAt) - Date.parse(left.createdAt);
        case "popular":
          return (
            Number(right.isBestseller) - Number(left.isBestseller) ||
            Number(right.isFeatured) - Number(left.isFeatured)
          );
        default:
          return (
            Number(right.isFeatured) - Number(left.isFeatured) ||
            Number(right.isBestseller) - Number(left.isBestseller) ||
            Number(right.isNew) - Number(left.isNew)
          );
      }
    });
  }, [availability, category, initialSearch, material, products, sort]);

  const hasFilters =
    category !== (initialCategory ?? "all") ||
    material !== "all" ||
    availability !== "all" ||
    sort !== "featured";

  function reset() {
    setCategory(initialCategory ?? "all");
    setMaterial("all");
    setAvailability("all");
    setSort("featured");
  }

  const controls = (
    <>
      {!initialCategory ? (
        <label className="block">
          <span className="field-label">Категория</span>
          <select
            className="field-select"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | "all")
            }
          >
            <option value="all">Все категории</option>
            {categories.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block">
        <span className="field-label">Материал</span>
        <select
          className="field-select"
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
        >
          <option value="all">Все материалы</option>
          {catalogMaterials.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Наличие</span>
        <select
          className="field-select"
          value={availability}
          onChange={(event) =>
            setAvailability(event.target.value as Availability)
          }
        >
          <option value="all">Все изделия</option>
          <option value="in-stock">В наличии</option>
          <option value="made-to-order">Изготовим на заказ</option>
        </select>
      </label>
      <button
        type="button"
        className="button-secondary w-full"
        onClick={reset}
        disabled={!hasFilters}
      >
        Сбросить фильтры
      </button>
    </>
  );

  return (
    <div className="site-container pb-20 sm:pb-28">
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-black/10 py-4">
        <div className="flex items-center gap-5">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={17} strokeWidth={1.5} />
            Фильтры
          </button>
          <p className="text-xs text-stone-500" aria-live="polite">
            Найдено: <span className="text-stone-900">{filtered.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <span className="hidden sm:inline">Сортировка</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSort)}
              className="min-h-11 border-0 bg-transparent pr-1 text-xs normal-case tracking-normal outline-none"
            >
              <option value="featured">Сначала избранные</option>
              <option value="newest">Сначала новые</option>
              <option value="popular">По популярности</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
            </select>
          </label>
          <div
            className="hidden items-center gap-2 border-l border-black/15 pl-4 lg:flex"
            aria-label="Количество колонок"
          >
            <button
              type="button"
              onClick={() => setColumns(3)}
              className={`grid-toggle ${columns === 3 ? "text-black" : "text-stone-400"}`}
              aria-label="Три колонки"
              aria-pressed={columns === 3}
            >
              III
            </button>
            <button
              type="button"
              onClick={() => setColumns(4)}
              className={`grid-toggle ${columns === 4 ? "text-black" : "text-stone-400"}`}
              aria-label="Четыре колонки"
              aria-pressed={columns === 4}
            >
              IIII
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr] lg:gap-12">
        <aside
          className="hidden space-y-7 lg:block"
          aria-label="Фильтры каталога"
        >
          {controls}
        </aside>
        <div>
          {filtered.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center border border-black/10 px-6 text-center">
              <p className="eyebrow text-stone-500">Ничего не найдено</p>
              <h2 className="mt-4 font-display text-4xl">Попробуем иначе?</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
                Измените материал или наличие — возможно, подходящее изделие
                скрыто текущими фильтрами.
              </p>
              <button
                type="button"
                className="button-secondary mt-7"
                onClick={reset}
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
            >
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`drawer-backdrop lg:hidden ${filtersOpen ? "is-open" : ""}`}
        onClick={() => setFiltersOpen(false)}
        aria-label="Закрыть фильтры"
      />
      <aside
        className={`cart-drawer z-[90] lg:hidden ${filtersOpen ? "is-open" : ""}`}
        aria-hidden={!filtersOpen}
        aria-label="Фильтры каталога"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
          <h2 className="font-display text-3xl">Фильтры</h2>
          <button
            type="button"
            className="icon-button"
            onClick={() => setFiltersOpen(false)}
            aria-label="Закрыть фильтры"
          >
            <X size={21} />
          </button>
        </div>
        <div className="space-y-7 overflow-y-auto px-5 py-7">{controls}</div>
        <div className="mt-auto border-t border-black/10 px-5 py-5">
          <button
            type="button"
            className="button-primary w-full"
            onClick={() => setFiltersOpen(false)}
          >
            Показать {filtered.length}
          </button>
        </div>
      </aside>
    </div>
  );
}
