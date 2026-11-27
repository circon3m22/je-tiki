"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart-provider";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
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
  const [liveProduct, setLiveProduct] = useState<Product | null>(
    getSupabaseBrowserClient() ? null : fallbackProduct ?? (slug ? productFallbacks.find((item) => item.slug === slug) ?? null : null),
  );
  const [loadState, setLoadState] = useState<"loading" | "missing" | "error" | "ready">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const closeOverlay = useCallback(() => router.replace(catalogHref, { scroll: false }), [catalogHref, router]);

  useModalFocus({ active: true, containerRef: dialogRef, onClose: closeOverlay });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const fallback = fallbackProduct ?? productFallbacks.find((item) => item.slug === requestedSlug) ?? null;
    setQuantity(1);
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

  const maxQuantity = product?.stock ? Math.min(product.stock, 99) : 99;
  const purchasePrice = product ? formatPrice(product.price * quantity) : "";

  return (
    <section
      ref={dialogRef}
      tabIndex={-1}
      className="product-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={product ? "product-title" : undefined}
      aria-label={product ? undefined : "Карточка товара"}
    >
      <div className="product-toolbar" tabIndex={-1} data-modal-initial-focus>
        <button type="button" className="overlay-close" onClick={closeOverlay}
          aria-label="Закрыть карточку товара">
          <CloseIcon className="icon" />
        </button>
      </div>

      {product ? (
        <div className="product-layout">
          <div className="product-content">
            <ProductGallery key={product.slug} images={product.images} name={product.name} />
            <div className="product-info">
              {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
              <h1 id="product-title">{product.name}</h1>
              {product.description && <p className="product-lead">{product.description}</p>}

              <div className="product-accordions">
                <details>
                  <summary>Характеристики</summary>
                  <dl className="spec-list">
                    {product.material && <div><dt>Материал</dt><dd>{product.material}</dd></div>}
                    <div><dt>Коллекция</dt><dd>{product.collection}</dd></div>
                    {!!product.variants?.length && <div><dt>Варианты</dt><dd>{product.variants.join(" · ")}</dd></div>}
                    {product.woodType && <div><dt>Порода дерева</dt><dd>{product.woodType}</dd></div>}
                    {product.metal && <div><dt>Металл</dt><dd>{product.metal}</dd></div>}
                    {product.dimensions && <div><dt>Размер</dt><dd>{product.dimensions}</dd></div>}
                    <div><dt>Наличие</dt><dd>{product.stock > 0 ? `В наличии: ${product.stock}` : product.orderable ? "Доступно под заказ" : "Нет в наличии"}</dd></div>
                  </dl>
                  {product.material && <p>Фактура и оттенок дерева могут незначительно отличаться от фотографии.</p>}
                </details>
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
          </div>

          <div className="product-purchase">
            {product.orderable ? (
              <div className="purchase-row">
                <div className="quantity" role="group" aria-label="Количество">
                  <button type="button" aria-label="Уменьшить количество" disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                    <MinusIcon className="icon-sm" />
                  </button>
                  <span className="tabular" aria-live="polite">{quantity}</span>
                  <button type="button" aria-label="Увеличить количество" disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}>
                    <PlusIcon className="icon-sm" />
                  </button>
                </div>
                <button
                  className="primary-button product-add-button"
                  type="button"
                  aria-label={`Добавить в корзину за ${purchasePrice}`}
                  onClick={() => addItem(product.slug, quantity)}
                >
                  <span className="product-add-label">Добавить в корзину</span>
                  <span className="product-purchase-price">{purchasePrice}</span>
                  <PlusIcon className="icon" />
                </button>
              </div>
            ) : (
              <div className="product-unavailable">
                <p role="status">Это изделие временно недоступно для заказа.</p>
                <span className="product-purchase-price">{formatPrice(product.price)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="product-status">
          {loadState === "loading" ? <p role="status">Загружаем товар…</p> : (
            <div className="product-load-error" role="alert">
              <p>{loadState === "error" ? "Не удалось загрузить изделие." : "Это изделие сейчас недоступно в каталоге."}</p>
              {loadState === "error"
                ? <button type="button" className="secondary-button" onClick={() => setReloadKey((value) => value + 1)}>Повторить</button>
                : <button type="button" className="secondary-button" onClick={closeOverlay}>Вернуться в каталог</button>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
