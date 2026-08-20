"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/money";
import { assetPath } from "@/lib/asset-path";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
  quickAdd = false,
  duplicate = false,
}: {
  product: Product;
  priority?: boolean;
  quickAdd?: boolean;
  duplicate?: boolean;
}) {
  const { addItem } = useCart();
  const productHref = `/product?slug=${encodeURIComponent(product.slug)}`;
  return (
    <article className="product-card" aria-hidden={duplicate || undefined}>
      <div className="product-media">
        <Link
          href={productHref}
          className="product-image-link"
          tabIndex={duplicate ? -1 : undefined}
          onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
        >
          <span className="sr-only">Открыть украшение «{product.name}»</span>
          {product.image ? (
            <>
              <Image
                className="product-image product-image--primary"
                src={product.image}
                alt={`${product.name}, ${product.subtitle.toLowerCase()}`}
                fill
                sizes="(max-width: 720px) 50vw, (max-width: 1100px) 44vw, 32vw"
                priority={priority}
              />
              {product.images[1] && product.images[1] !== product.image && (
                <Image
                  className="product-image product-image--secondary"
                  src={product.images[1]}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 50vw, (max-width: 1100px) 44vw, 32vw"
                />
              )}
            </>
          ) : (
            <span className="product-placeholder" aria-hidden="true">
              <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" width={181} height={74} />
              <span>Фотография готовится</span>
            </span>
          )}
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <h3>
            <Link
              href={productHref}
              tabIndex={duplicate ? -1 : undefined}
              onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
            >
              {product.name}
            </Link>
          </h3>
          <p>{product.subtitle}</p>
        </div>
        <div className="product-actions">
          {quickAdd && (
            <button
              className="product-quick-add"
              type="button"
              aria-label={product.orderable ? `Добавить «${product.name}» в корзину` : `«${product.name}» временно недоступно`}
              title={product.orderable ? "Добавить в корзину" : "Временно недоступно"}
              disabled={!product.orderable}
              tabIndex={duplicate ? -1 : undefined}
              onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
              onClick={() => { if (product.orderable) addItem(product.slug); }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
          <p className="price">{formatPrice(product.price)}</p>
        </div>
      </div>
    </article>
  );
}
