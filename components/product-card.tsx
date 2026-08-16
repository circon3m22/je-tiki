"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types/catalog";
import { formatPrice, formatProductAvailability } from "@/lib/formatters";
import { useCartStore } from "@/lib/cart/store";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const max = Math.max(1, product.stock || 1);
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  function handleAdd() {
    addItem(product.id, { max });
    setAdded(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className="product-card group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e4d9]">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-10"
        >
          <span className="sr-only">Открыть {product.name}</span>
        </Link>
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="product-card-primary object-cover"
        />
        {product.images[1] ? (
          <Image
            src={product.images[1].src}
            alt={product.images[1].alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="product-card-secondary object-cover"
          />
        ) : null}
        <div className="absolute left-3 top-3 z-20 flex gap-1.5">
          {product.isNew ? (
            <span className="product-badge">Новинка</span>
          ) : null}
          {product.isBestseller ? (
            <span className="product-badge">Выбор</span>
          ) : null}
        </div>
        <button
          type="button"
          className={`quick-add ${added ? "is-added" : ""}`}
          onClick={handleAdd}
          disabled={!product.isAvailable}
          aria-label={
            added
              ? `${product.name} добавлено в корзину`
              : `Добавить ${product.name} в корзину`
          }
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
          <span>{added ? "Добавлено" : "В корзину"}</span>
        </button>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium leading-5">
              <Link href={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
            <p className="mt-1 truncate text-[11px] text-stone-500">
              {[product.woodType, product.metal].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="shrink-0 text-right text-sm">
            <span>{formatPrice(product.price)}</span>
            {product.oldPrice ? (
              <span className="ml-2 text-xs text-stone-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
          </div>
        </div>
        <p
          className={`mt-2 text-[10px] uppercase tracking-[0.13em] ${product.stock > 0 ? "text-[#536650]" : "text-stone-500"}`}
        >
          {formatProductAvailability(product)}
        </p>
      </div>
    </article>
  );
}
