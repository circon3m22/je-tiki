"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/money";
import { assetPath } from "@/lib/asset-path";
import type { Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mapSupabaseProduct } from "@/lib/supabase-product";
import { products as productFallbacks } from "@/lib/products";
import { useModalFocus } from "@/lib/use-modal-focus";

export function ProductOverlay({ product = null, slug }: { product?: Product | null; slug?: string }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [liveProduct, setLiveProduct] = useState<Product | null>(
    product ?? (slug ? productFallbacks.find((item) => item.slug === slug) ?? null : null),
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeOverlay = useCallback(() => router.push("/catalog"), [router]);

  useModalFocus({ active: true, containerRef: dialogRef, onClose: closeOverlay });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const requestedSlug = new URLSearchParams(window.location.search).get("slug") || slug || product?.slug;
    const fallback = product ?? productFallbacks.find((item) => item.slug === requestedSlug) ?? null;
    if (fallback) setLiveProduct(fallback);
    setQuantity(1);
    setActiveImageIndex(0);
    if (!supabase || !requestedSlug) { setLoadFailed(!fallback); return; }

    let active = true;
    setLoadFailed(false);
    void supabase.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("slug", requestedSlug).eq("status", "published").maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (data) setLiveProduct(mapSupabaseProduct(data, fallback ?? undefined));
      else if (!error) { setLiveProduct(null); setLoadFailed(true); }
      else if (!fallback) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [product, reloadKey, slug]);

  if (!liveProduct) {
    return (
      <div className="overlay-backdrop" role="presentation" onMouseDown={closeOverlay}>
        <section ref={dialogRef} tabIndex={-1} className="product-overlay product-overlay--loading" role="dialog" aria-modal="true" aria-label="Карточка товара" onMouseDown={(event) => event.stopPropagation()}>
          <button ref={closeButtonRef} data-modal-initial-focus type="button" className="overlay-close" aria-label="Закрыть карточку товара" onClick={closeOverlay}>
            <CloseIcon className="icon" />
          </button>
          {loadFailed ? (
            <div className="product-load-error" role="alert">
              <p>Товар не найден или временно недоступен. Вернитесь в каталог или попробуйте ещё раз.</p>
              <button type="button" className="secondary-button" onClick={() => setReloadKey((value) => value + 1)}>Повторить</button>
            </div>
          ) : <p role="status">Загружаем товар…</p>}
        </section>
      </div>
    );
  }

  product = liveProduct;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={closeOverlay}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="product-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          data-modal-initial-focus
          type="button"
          className="overlay-close"
          aria-label="Закрыть карточку товара"
          onClick={closeOverlay}
        >
          <CloseIcon className="icon" />
        </button>

        <div className="product-gallery" role="region" aria-label={`Фотографии товара «${product.name}»`}>
          {product.images.length > 0 ? (
            <>
              <div className="gallery-image" key={`${product.slug}-${activeImageIndex}`}>
                <Image
                  src={product.images[activeImageIndex]}
                  alt={`${product.name}, фото ${activeImageIndex + 1} из ${product.images.length}`}
                  fill
                  sizes="(max-width: 800px) 100vw, 55vw"
                  priority={activeImageIndex === 0}
                />
              </div>
              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow--previous"
                    aria-label="Показать предыдущее фото"
                    onClick={() => setActiveImageIndex((index) => (index - 1 + product.images.length) % product.images.length)}
                  >
                    <ArrowIcon className="icon" />
                  </button>
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow--next"
                    aria-label="Показать следующее фото"
                    onClick={() => setActiveImageIndex((index) => (index + 1) % product.images.length)}
                  >
                    <ArrowIcon className="icon" />
                  </button>
                  <p className="gallery-position" aria-live="polite">
                    {activeImageIndex + 1} / {product.images.length}
                  </p>
                </>
              )}
            </>
          ) : (
              <div className="gallery-placeholder">
                <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" width={241} height={98} />
                <p>Фотография изделия готовится</p>
              </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-title-row">
            <div>
              <p className="eyebrow">{product.subtitle}</p>
              <h1 id="product-title">{product.name}</h1>
            </div>
            <p className="product-price">{formatPrice(product.price)}</p>
          </div>

          <p className="product-lead">{product.description}</p>

          <dl className="spec-list">
            <div><dt>Материал</dt><dd>{product.material}</dd></div>
            <div><dt>Коллекция</dt><dd>{product.collection}</dd></div>
            {product.variants && <div><dt>Варианты</dt><dd>{product.variants.join(" · ")}</dd></div>}
            <div><dt>Порода дерева</dt><dd>{product.woodType}</dd></div>
            <div><dt>Металл</dt><dd>{product.metal}</dd></div>
            <div><dt>Размер</dt><dd>{product.dimensions}</dd></div>
            <div><dt>Наличие</dt><dd>{product.stock > 0 ? `В наличии: ${product.stock}` : "Доступно под заказ"}</dd></div>
          </dl>

          {product.orderable ? <div className="purchase-row">
              <div className="quantity" aria-label="Количество">
                <button
                  type="button"
                  aria-label="Уменьшить количество"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <MinusIcon className="icon-sm" />
                </button>
                <span className="tabular" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Увеличить количество"
                  disabled={quantity >= (product.stock > 0 ? Math.min(product.stock, 99) : 99)}
                  onClick={() => setQuantity((value) => Math.min(product.stock > 0 ? Math.min(product.stock, 99) : 99, value + 1))}
                >
                  <PlusIcon className="icon-sm" />
                </button>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => addItem(product.slug, quantity)}
              >
                Добавить в корзину
              </button>
          </div> : <p className="product-unavailable" role="status">Это изделие временно недоступно для заказа.</p>}

          <div className="product-accordions">
            <details open>
              <summary>Материалы и особенности</summary>
              <p>{product.material}. Фактура и оттенок дерева могут незначительно отличаться от фотографии.</p>
            </details>
            <details>
              <summary>Уход</summary>
              <p>{product.care}</p>
            </details>
            <details>
              <summary>Доставка</summary>
              <p>СДЭК или Почта России. Бесплатно при заказе от 5 000 ₽.</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
