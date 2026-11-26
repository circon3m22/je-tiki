"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart-provider";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { assetPath } from "@/lib/asset-path";
import type { Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mapSupabaseProduct } from "@/lib/supabase-product";
import { products as productFallbacks } from "@/lib/products";
import { useModalFocus } from "@/lib/use-modal-focus";

export function ProductOverlay({ product: fallbackProduct = null, slug }: { product?: Product | null; slug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSlug = slug ?? searchParams.get("slug");
  const catalogParams = new URLSearchParams(searchParams);
  catalogParams.delete("slug");
  const catalogHref = catalogParams.size ? `/catalog/?${catalogParams}` : "/catalog/";
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [liveProduct, setLiveProduct] = useState<Product | null>(
    getSupabaseBrowserClient() ? null : fallbackProduct ?? (slug ? productFallbacks.find((item) => item.slug === slug) ?? null : null),
  );
  const [loadState, setLoadState] = useState<"loading" | "missing" | "error" | "ready">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeOverlay = useCallback(() => router.replace(catalogHref, { scroll: false }), [catalogHref, router]);

  useModalFocus({ active: true, containerRef: dialogRef, onClose: closeOverlay });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const fallback = fallbackProduct ?? productFallbacks.find((item) => item.slug === requestedSlug) ?? null;
    setQuantity(1);
    setActiveImageIndex(0);
    if (!supabase || !requestedSlug) {
      setLiveProduct(fallback);
      setLoadState(fallback ? "ready" : "missing");
      return;
    }

    setLiveProduct(null);

    let active = true;
    setLoadState("loading");
    void supabase.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),collections:collections!products_collection_id_fkey(slug,name),product_images(storage_path,external_url,sort_order)").eq("slug", requestedSlug).eq("status", "published").maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (data) setLiveProduct(mapSupabaseProduct(data, fallback ?? undefined));
      setLoadState(error ? "error" : data ? "ready" : "missing");
    });
    return () => { active = false; };
  }, [fallbackProduct, reloadKey, requestedSlug]);

  const product = liveProduct?.slug === requestedSlug ? liveProduct : null;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={closeOverlay}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={product ? "product-overlay" : "product-overlay product-overlay--loading"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={product ? "product-title" : undefined}
        aria-label={product ? undefined : "Карточка товара"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="overlay-close-bar">
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
        </div>

        {product ? <>
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
                {product.subtitle && <p className="eyebrow">{product.subtitle}</p>}
                <h1 id="product-title">{product.name}</h1>
              </div>
              <p className="product-price">{formatPrice(product.price)}</p>
            </div>

            {product.description && <p className="product-lead">{product.description}</p>}

            <dl className="spec-list">
              {product.material && <div><dt>Материал</dt><dd>{product.material}</dd></div>}
              <div><dt>Коллекция</dt><dd>{product.collection}</dd></div>
              {product.variants && <div><dt>Варианты</dt><dd>{product.variants.join(" · ")}</dd></div>}
              {product.woodType && <div><dt>Порода дерева</dt><dd>{product.woodType}</dd></div>}
              {product.metal && <div><dt>Металл</dt><dd>{product.metal}</dd></div>}
              {product.dimensions && <div><dt>Размер</dt><dd>{product.dimensions}</dd></div>}
              <div><dt>Наличие</dt><dd>{product.stock > 0 ? `В наличии: ${product.stock}` : product.orderable ? "Доступно под заказ" : "Нет в наличии"}</dd></div>
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
              {product.material && <details open>
                <summary>Материалы и особенности</summary>
                <p>{product.material}. Фактура и оттенок дерева могут незначительно отличаться от фотографии.</p>
              </details>}
              {product.care && <details>
                <summary>Уход</summary>
                <p>{product.care}</p>
              </details>}
              <details>
                <summary>Доставка</summary>
                <p>СДЭК или Почта России. Бесплатно при заказе от {formatPrice(FREE_SHIPPING_THRESHOLD)}.</p>
              </details>
            </div>
          </div>
        </> : loadState === "loading" ? <p role="status">Загружаем товар…</p> : (
          <div className="product-load-error" role="alert">
            <p>{loadState === "error" ? "Не удалось загрузить изделие." : "Это изделие сейчас недоступно в каталоге."}</p>
            {loadState === "error"
              ? <button type="button" className="secondary-button" onClick={() => setReloadKey((value) => value + 1)}>Повторить</button>
              : <button type="button" className="secondary-button" onClick={closeOverlay}>Вернуться в каталог</button>}
          </div>
        )}
      </section>
    </div>
  );
}
