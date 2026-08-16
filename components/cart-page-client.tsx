"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { localProducts } from "@/lib/catalog";
import { SITE_CONFIG } from "@/lib/config/site";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/formatters";

export function CartPageClient() {
  const { items, hasHydrated, removeItem, setQuantity, clear } = useCartStore();
  const detailedItems = items.flatMap((item) => {
    const product = localProducts.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = detailedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const remaining = Math.max(0, SITE_CONFIG.delivery.freeFrom - subtotal);

  if (!hasHydrated) {
    return (
      <div className="site-container flex min-h-[55vh] items-center justify-center text-sm text-stone-500">
        Загружаем корзину…
      </div>
    );
  }

  if (detailedItems.length === 0) {
    return (
      <div className="site-container flex min-h-[65vh] flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag size={40} strokeWidth={1.1} className="mb-7" />
        <p className="eyebrow text-stone-500">Корзина пуста</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl">
          Найдите свою форму
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
          В каталоге — украшения и небольшие предметы с неповторимым рисунком
          дерева.
        </p>
        <Link href="/catalog" className="button-primary mt-9">
          Перейти в каталог
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container pb-20 pt-8 sm:pb-28 sm:pt-14">
      <div className="flex items-end justify-between gap-5 border-b border-black/10 pb-7">
        <div>
          <p className="eyebrow mb-4 text-stone-500">Ваш выбор</p>
          <h1 className="display-title">Корзина</h1>
        </div>
        <button
          type="button"
          className="hidden text-[10px] uppercase tracking-[0.15em] underline underline-offset-4 sm:block"
          onClick={() => {
            if (
              window.confirm("Очистить корзину? Это действие нельзя отменить.")
            )
              clear();
          }}
        >
          Очистить
        </button>
      </div>
      <div className="grid gap-12 pt-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
        <div>
          {detailedItems.map(({ product, quantity, variant }) => {
            const max = Math.max(1, product.stock || 1);
            return (
              <article
                key={`${product.id}-${variant}`}
                className="grid grid-cols-[108px_1fr] gap-4 border-b border-black/10 py-6 sm:grid-cols-[150px_1fr] sm:gap-7"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="relative aspect-[4/5] overflow-hidden bg-stone-200"
                >
                  <Image
                    src={product.images[0].src}
                    alt={product.images[0].alt}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl sm:text-3xl">
                        <Link href={`/product/${product.slug}`}>
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-xs text-stone-500">
                        {[product.woodType, product.metal]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id, variant)}
                      className="p-2 text-stone-500 hover:text-black"
                      aria-label={`Удалить ${product.name}`}
                    >
                      <Trash2 size={18} strokeWidth={1.4} />
                    </button>
                  </div>
                  <p className="mt-3 text-sm">{formatPrice(product.price)}</p>
                  <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
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
                      <span>{quantity}</span>
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
                    <strong>{formatPrice(product.price * quantity)}</strong>
                  </div>
                  {quantity >= max && product.stock > 0 ? (
                    <p className="mt-2 text-xs text-[#8d2f26]">
                      Это максимальное доступное количество.
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
          <button
            type="button"
            className="mt-5 text-[10px] uppercase tracking-[0.15em] underline underline-offset-4 sm:hidden"
            onClick={() => {
              if (
                window.confirm(
                  "Очистить корзину? Это действие нельзя отменить.",
                )
              )
                clear();
            }}
          >
            Очистить корзину
          </button>
        </div>
        <aside className="h-fit bg-[#e8e1d5] p-6 sm:p-8 lg:sticky lg:top-32">
          <p className="eyebrow text-stone-500">Итого</p>
          <dl className="mt-7 space-y-4 border-b border-black/10 pb-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Товары</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Доставка</dt>
              <dd className="text-right text-stone-500">при оформлении</dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between gap-4 py-6">
            <span className="font-display text-2xl">К оплате</span>
            <strong className="text-lg">{formatPrice(subtotal)}</strong>
          </div>
          {remaining > 0 ? (
            <div className="mb-6">
              <div className="h-1 bg-black/10">
                <div
                  className="h-full bg-[#536650]"
                  style={{
                    width: `${Math.min(100, (subtotal / SITE_CONFIG.delivery.freeFrom) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                До бесплатной доставки осталось {formatPrice(remaining)}
              </p>
            </div>
          ) : (
            <p className="mb-6 text-xs font-medium text-[#536650]">
              Для этого заказа доставка бесплатна.
            </p>
          )}
          <Link href="/checkout" className="button-primary w-full">
            Оформить заказ
            <ArrowRight size={15} />
          </Link>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            Финальные цены и наличие будут повторно проверены на сервере.
          </p>
        </aside>
      </div>
    </div>
  );
}
