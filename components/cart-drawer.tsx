"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { localProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/formatters";
import { getCartCount, useCartStore } from "@/lib/cart/store";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, setQuantity, hasHydrated } =
    useCartStore();
  const detailedItems = items.flatMap((item) => {
    const product = localProducts.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = detailedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <>
      <button
        type="button"
        className={`drawer-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={close}
        aria-label="Закрыть корзину"
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
        aria-label="Корзина"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-7">
          <div>
            <p className="eyebrow">Ваш выбор</p>
            <h2 className="font-display text-3xl">Корзина</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="Закрыть корзину"
          >
            <X size={21} strokeWidth={1.5} />
          </button>
        </div>

        {!hasHydrated ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-stone-500">
            Загружаем корзину…
          </div>
        ) : detailedItems.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
            <ShoppingBag size={34} strokeWidth={1.2} className="mb-6" />
            <h3 className="font-display text-3xl">Здесь пока тихо</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">
              Соберите свою подборку изделий — мы сохраним её на этом
              устройстве.
            </p>
            <Link
              href="/catalog"
              className="button-primary mt-8"
              onClick={close}
            >
              Смотреть коллекцию
            </Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 sm:px-7">
              {detailedItems.map(({ product, quantity, variant }) => {
                const max = Math.max(1, product.stock || 1);
                return (
                  <article
                    key={`${product.id}-${variant}`}
                    className="grid grid-cols-[92px_1fr] gap-4 border-b border-black/10 py-5"
                  >
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={close}
                      className="relative aspect-[4/5] overflow-hidden bg-stone-100"
                    >
                      <Image
                        src={product.images[0].src}
                        alt={product.images[0].alt}
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={close}
                            className="font-medium leading-5 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-xs text-stone-500">
                            {product.woodType ?? product.materials[0]}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id, variant)}
                          className="p-1 text-stone-500 transition hover:text-black"
                          aria-label={`Удалить ${product.name}`}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-4">
                        <div className="quantity-control compact">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity - 1, {
                                variant,
                                max,
                              })
                            }
                            aria-label="Уменьшить количество"
                          >
                            <Minus size={14} />
                          </button>
                          <span aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity + 1, {
                                variant,
                                max,
                              })
                            }
                            disabled={quantity >= max}
                            aria-label="Увеличить количество"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(product.price * quantity)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="border-t border-black/10 bg-[#f5f1e8] px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between text-sm">
                <span>Товаров: {getCartCount(items)}</span>
                <strong className="text-base">{formatPrice(subtotal)}</strong>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Стоимость доставки рассчитывается при оформлении.
              </p>
              <Link
                href="/checkout"
                className="button-primary mt-5 w-full"
                onClick={close}
              >
                Перейти к оформлению
              </Link>
              <Link
                href="/cart"
                className="mt-3 block text-center text-xs underline underline-offset-4"
                onClick={close}
              >
                Открыть корзину
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
