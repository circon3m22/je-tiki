"use client";

import { useEffect, useState } from "react";
import { localProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

const STORAGE_KEY = "je-tiki-recently-viewed";

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    let nextSlugs: string[] = [];
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as unknown;
      const previous = Array.isArray(saved)
        ? saved.filter((value): value is string => typeof value === "string")
        : [];
      const next = [
        currentSlug,
        ...previous.filter((slug) => slug !== currentSlug),
      ].slice(0, 6);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      nextSlugs = previous.filter((slug) => slug !== currentSlug).slice(0, 4);
    } catch {}
    const timer = window.setTimeout(() => setSlugs(nextSlugs), 0);
    return () => window.clearTimeout(timer);
  }, [currentSlug]);

  const products = slugs.flatMap((slug) => {
    const product = localProducts.find((entry) => entry.slug === slug);
    return product ? [product] : [];
  });

  if (products.length === 0) return null;

  return (
    <section className="site-container pb-20 sm:pb-28">
      <div className="mb-9 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-4 text-stone-500">История просмотра</p>
          <h2 className="font-display text-4xl sm:text-5xl">Вы смотрели</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-4 sm:gap-x-5">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}
