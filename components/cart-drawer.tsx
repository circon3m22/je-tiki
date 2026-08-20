"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import {
  calculateShipping,
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/money";
import { products } from "@/lib/products";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { assetPath } from "@/lib/asset-path";
import type { Product } from "@/lib/types";
import { mapSupabaseProduct } from "@/lib/supabase-product";
import { useModalFocus } from "@/lib/use-modal-focus";

export function CartDrawer() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { lines, isOpen, closeCart, updateQuantity, removeItem, clearCart, prepareCheckout } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [catalogReady, setCatalogReady] = useState(false);
  const [legalDocumentsPublished, setLegalDocumentsPublished] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLFormElement>(null);

  useModalFocus({ active: isOpen, containerRef: dialogRef, onClose: closeCart });

  const items = lines.flatMap((line) => {
    const product = catalogProducts.find((item) => item.slug === line.slug);
    return product ? [{ ...line, product }] : [];
  });
  const missingLines = lines.filter((line) => !catalogProducts.some((product) => product.slug === line.slug));
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shipping = items.length ? calculateShipping(subtotal) : 0;
  const total = subtotal + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const checkoutBlocked = missingLines.length > 0 || items.some(({ product, quantity }) => (
    !product.orderable || (product.stock > 0 && quantity > product.stock)
  ));
  const checkoutAvailable = Boolean(supabase) && legalDocumentsPublished;

  useEffect(() => {
    if (!supabase) { setCatalogReady(true); return; }
    let active = true;
    void (async () => {
      const [productResult, legalResult] = await Promise.all([
        supabase.from("products").select("slug,name,subtitle,description,price,orderable,stock_quantity,material,wood_type,metal,dimensions,care,categories(name),product_images(storage_path,external_url,sort_order)").eq("status", "published"),
        supabase.from("legal_documents").select("slug").eq("published", true).in("slug", ["offer", "privacy", "personal-data", "returns"]),
      ]);
      if (!active) return;
      if (productResult.data) setCatalogProducts(productResult.data.map((row) => mapSupabaseProduct(row, products.find((item) => item.slug === row.slug))));
      const publishedSlugs = new Set((legalResult.data ?? []).map((document) => document.slug));
      setLegalDocumentsPublished(["offer", "privacy", "personal-data", "returns"].every((slug) => publishedSlugs.has(slug)));
      setCatalogReady(true);
    })();
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) { setCheckout(false); setSubmitError(""); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const target = checkout
        ? checkoutRef.current?.querySelector<HTMLInputElement>("input")
        : closeRef.current;
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [checkout, isOpen]);

  if (!isOpen) return null;

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const form = new FormData(event.currentTarget);
    if (!supabase) {
      setSubmitting(false);
      setSubmitError("Оформление временно недоступно. Попробуйте позже.");
      return;
    }

    type OrderResponse = { order_number?: string; error?: string };
    let data: OrderResponse | null = null;
    let error: unknown = null;
    try {
      await prepareCheckout();
      const result = await supabase.functions.invoke("create-order", {
        body: {
          customer_name: form.get("name"),
          customer_phone: form.get("phone"),
          customer_email: form.get("email"),
          shipping_city: form.get("city"),
          shipping_address: form.get("address"),
          shipping_method: form.get("shipping"),
          comment: form.get("comment") || null,
          offer_accepted: form.get("offer_accepted") === "on",
          personal_data_consent: form.get("personal_data_consent") === "on",
        },
      });
      data = result.data as OrderResponse | null;
      error = result.error;
    } catch (caughtError) {
      error = caughtError;
    }

    if (error || !data?.order_number) {
      setSubmitting(false);
      const code = data?.error;
      setSubmitError(
        code === "empty_cart" || code === "stock_changed"
          ? "Состав корзины изменился. Вернитесь в корзину, проверьте товары и попробуйте ещё раз."
          : code === "legal_documents_unavailable"
            ? "Оформление временно недоступно. Попробуйте позже — товары в корзине сохранены."
          : "Не удалось подготовить заказ. Попробуйте ещё раз — товары в корзине сохранены.",
      );
      return;
    }

    const orderNumber = data.order_number as string;

    clearCart();
    closeCart();
    router.push(`/order/success?number=${encodeURIComponent(orderNumber)}`);
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={closeCart}>
      <aside
        ref={dialogRef}
        tabIndex={-1}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{checkout ? "Оформление" : "Ваш выбор"}</p>
            <h2 id="cart-title">{checkout ? "Контакты и доставка" : "Корзина"}</h2>
          </div>
          <button ref={closeRef} data-modal-initial-focus className="icon-button" type="button" onClick={closeCart} aria-label="Закрыть корзину">
            <CloseIcon className="icon" />
          </button>
        </div>

        {!checkout ? (
          <>
            <div className="drawer-content">
              {items.length === 0 && lines.length > 0 && !catalogReady ? (
                <div className="empty-cart" role="status"><p className="empty-title">Загружаем корзину…</p></div>
              ) : lines.length === 0 ? (
                <div className="empty-cart">
                  <p className="empty-title">В корзине пока пусто</p>
                  <p>Выберите украшение в каталоге — оно останется здесь, даже если вы закроете сайт.</p>
                  <button className="text-link" type="button" onClick={() => { closeCart(); router.push("/catalog"); }}>
                    Перейти в каталог
                  </button>
                </div>
              ) : (
                <div className="cart-lines">
                  {items.map(({ product, quantity }) => (
                    <article className="cart-line" key={product.slug}>
                      <div className="cart-line-image">
                        <Image src={product.image ?? assetPath("/je-tiki-logo-v2.svg")} alt="" fill sizes="96px" />
                      </div>
                      <div className="cart-line-info">
                        <div className="cart-line-title">
                          <div><h3>{product.name}</h3><p>{product.subtitle}</p></div>
                          <p className="price">{formatPrice(product.price * quantity)}</p>
                        </div>
                        {!product.orderable && <p className="checkout-unavailable" role="status">Товар временно недоступен для заказа.</p>}
                        {product.stock > 0 && quantity > product.stock && <p className="checkout-unavailable" role="status">Доступно только: {product.stock}. Уменьшите количество.</p>}
                        <div className="cart-line-actions">
                          <div className="quantity compact" aria-label={`Количество товара ${product.name}`}>
                            <button type="button" aria-label="Уменьшить количество" onClick={() => updateQuantity(product.slug, quantity - 1)}>
                              <MinusIcon className="icon-sm" />
                            </button>
                            <span className="tabular">{quantity}</span>
                            <button
                              type="button"
                              aria-label="Увеличить количество"
                              disabled={quantity >= (product.stock > 0 ? Math.min(product.stock, 99) : 99)}
                              onClick={() => updateQuantity(product.slug, quantity + 1)}
                            >
                              <PlusIcon className="icon-sm" />
                            </button>
                          </div>
                          <button className="remove-button" type="button" onClick={() => removeItem(product.slug)}>Удалить</button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {missingLines.map((line) => (
                    <article className="cart-line" key={line.slug}>
                      <div className="cart-line-image">
                        <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" fill sizes="96px" />
                      </div>
                      <div className="cart-line-info">
                        <div className="cart-line-title"><div><h3>Товар недоступен</h3><p>{line.slug}</p></div></div>
                        <p className="checkout-unavailable" role="status">Товар больше не представлен в каталоге.</p>
                        <button className="remove-button" type="button" onClick={() => removeItem(line.slug)}>Удалить</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <div className="drawer-summary">
                {subtotal > 0 && remaining > 0 && <p className="shipping-note">До бесплатной доставки осталось {formatPrice(remaining)}</p>}
                <div className="summary-row"><span>Товары</span><span>{formatPrice(subtotal)}</span></div>
                <div className="summary-row"><span>Доставка</span><span>{shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span></div>
                <div className="summary-row total"><span>Итого</span><span>{formatPrice(total)}</span></div>
                {!checkoutAvailable && (
                  <p id="checkout-unavailable" className="checkout-unavailable" role="status">
                    Оформление заказов временно недоступно. Корзина сохранится на этом устройстве.
                  </p>
                )}
                {checkoutAvailable && checkoutBlocked && (
                  <p id="checkout-blocked" className="checkout-unavailable" role="status">
                    Проверьте доступность и количество товаров перед оформлением.
                  </p>
                )}
                <button
                  className="primary-button full"
                  type="button"
                  aria-describedby={!checkoutAvailable ? "checkout-unavailable" : checkoutBlocked ? "checkout-blocked" : undefined}
                  disabled={!checkoutAvailable || checkoutBlocked}
                  onClick={() => {
                    if (checkoutAvailable && !checkoutBlocked) setCheckout(true);
                  }}
                >
                  Оформить заказ
                </button>
              </div>
            )}
          </>
        ) : (
          <form ref={checkoutRef} className="checkout-form" onSubmit={submitOrder}>
            <div className="checkout-fields">
              <label>Имя<input required name="name" autoComplete="name" placeholder="Анна" /></label>
              <label>Телефон<input required name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+7 900 000-00-00" /></label>
              <label>Электронная почта<input required name="email" type="email" autoComplete="email" inputMode="email" placeholder="name@example.com" /></label>
              <label>Город или населённый пункт<input required name="city" autoComplete="address-level2" placeholder="Владивосток" /></label>
              <label>Адрес<input required name="address" autoComplete="street-address" placeholder="Улица, дом, квартира" /></label>
              <fieldset>
                <legend>Способ доставки</legend>
                <label className="radio-label"><input defaultChecked type="radio" name="shipping" value="cdek" />СДЭК</label>
                <label className="radio-label"><input type="radio" name="shipping" value="post" />Почта России</label>
              </fieldset>
              <label>Комментарий <span className="muted">(необязательно)</span><textarea name="comment" rows={3} placeholder="Пожелания к заказу" /></label>
            </div>
            <fieldset className="checkout-consents">
              <legend>Согласия для оформления заказа</legend>
              <div className="checkout-consent">
                <label htmlFor="offer-accepted">
                  <input id="offer-accepted" required name="offer_accepted" type="checkbox" />
                  <span>Я принимаю условия публичной оферты.</span>
                </label>
                <Link href="/legal/offer" target="_blank" rel="noopener noreferrer">
                  Прочитать публичную оферту<span className="sr-only"> (откроется в новой вкладке)</span>
                </Link>
              </div>
              <div className="checkout-consent">
                <label htmlFor="personal-data-consent">
                  <input id="personal-data-consent" required name="personal_data_consent" type="checkbox" />
                  <span>Я даю согласие на обработку персональных данных.</span>
                </label>
                <Link href="/legal/personal-data" target="_blank" rel="noopener noreferrer">
                  Прочитать текст согласия<span className="sr-only"> (откроется в новой вкладке)</span>
                </Link>
              </div>
            </fieldset>
            <div className="checkout-total">
              <div><span>К оплате</span><strong>{formatPrice(total)}</strong></div>
              <p>После заказа мы свяжемся с вами и согласуем удобный пункт выдачи.</p>
            </div>
            <p className="form-error" role="alert">{submitError}</p>
            <div className="checkout-actions">
              <button className="secondary-button" type="button" onClick={() => setCheckout(false)}>Назад к корзине</button>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Оформляем заказ…" : "Подтвердить заказ"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
