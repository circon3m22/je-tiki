"use client";

import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { localProducts } from "@/lib/catalog";
import {
  CHECKOUT_DELIVERY_CONFIG,
  calculateDeliveryPrice,
} from "@/lib/checkout/delivery";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/formatters";
import {
  checkoutRequestSchema,
  type CheckoutRequest,
  type DeliveryMethod,
} from "@/lib/validation/checkout";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  const normalized = digits.startsWith("8")
    ? `7${digits.slice(1)}`
    : digits.startsWith("7")
      ? digits
      : `7${digits}`;
  const parts = normalized.slice(0, 11);
  let result = parts ? "+7" : "";
  if (parts.length > 1) result += ` (${parts.slice(1, 4)}`;
  if (parts.length >= 4) result += ")";
  if (parts.length > 4) result += ` ${parts.slice(4, 7)}`;
  if (parts.length > 7) result += `-${parts.slice(7, 9)}`;
  if (parts.length > 9) result += `-${parts.slice(9, 11)}`;
  return result;
}

export function CheckoutForm() {
  const { items, hasHydrated } = useCartStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const details = items.flatMap((item) => {
    const product = localProducts.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = details.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutRequest>({
    resolver: zodResolver(checkoutRequestSchema),
    defaultValues: {
      customerName: "",
      customerSurname: "",
      customerPhone: "",
      customerEmail: "",
      city: "",
      postalCode: "",
      address: "",
      apartment: "",
      deliveryMethod: "pickup-khabarovsk",
      customerComment: "",
      privacyAccepted: false,
      items: [],
    },
  });
  const deliveryMethod = useWatch({ control, name: "deliveryMethod" });
  const deliveryPrice = calculateDeliveryPrice(deliveryMethod, subtotal);
  const total = subtotal + deliveryPrice;

  useEffect(() => {
    setValue(
      "items",
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      { shouldValidate: false },
    );
  }, [items, setValue]);

  async function onSubmit(values: CheckoutRequest) {
    setServerError(null);
    const requestKey = idempotencyKey ?? crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(requestKey);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({ ...values, idempotencyKey: requestKey }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        confirmationUrl?: string | null;
        orderNumber?: string;
      };
      if (!response.ok || !payload.ok) {
        setServerError(
          payload.message ?? "Не удалось оформить заказ. Попробуйте ещё раз.",
        );
        return;
      }
      if (payload.confirmationUrl) {
        window.location.assign(payload.confirmationUrl);
        return;
      }
      if (payload.orderNumber) {
        window.location.assign(
          `/order/success?order=${encodeURIComponent(payload.orderNumber)}`,
        );
      }
    } catch {
      setServerError(
        "Сервер временно недоступен. Проверьте соединение и повторите попытку.",
      );
    }
  }

  if (!hasHydrated) {
    return (
      <div className="site-container flex min-h-[50vh] items-center justify-center text-sm text-stone-500">
        Загружаем заказ…
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <div className="site-container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-5xl sm:text-7xl">Корзина пуста</h1>
        <p className="mt-4 text-sm text-stone-600">
          Сначала выберите изделие в каталоге.
        </p>
        <Link href="/catalog" className="button-primary mt-8">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="site-container pb-20 pt-8 sm:pb-28 sm:pt-12"
      noValidate
    >
      <div className="mb-10 border-b border-black/10 pb-8">
        <p className="eyebrow mb-4 text-stone-500">Шаг 2 из 2</p>
        <h1 className="display-title">Оформление</h1>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.7fr] lg:gap-20">
        <div className="space-y-12">
          <section>
            <h2 className="font-display text-3xl sm:text-4xl">
              Контактные данные
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Имя" error={errors.customerName?.message}>
                <input
                  className="field-input"
                  autoComplete="given-name"
                  {...register("customerName")}
                />
              </Field>
              <Field label="Фамилия" error={errors.customerSurname?.message}>
                <input
                  className="field-input"
                  autoComplete="family-name"
                  {...register("customerSurname")}
                />
              </Field>
              <Field label="Телефон" error={errors.customerPhone?.message}>
                <Controller
                  control={control}
                  name="customerPhone"
                  render={({ field }) => (
                    <input
                      className="field-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 (999) 000-00-00"
                      {...field}
                      onChange={(event) =>
                        field.onChange(formatPhone(event.target.value))
                      }
                    />
                  )}
                />
              </Field>
              <Field
                label="Электронная почта"
                error={errors.customerEmail?.message}
              >
                <input
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  {...register("customerEmail")}
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl sm:text-4xl">
              Способ доставки
            </h2>
            <div className="mt-6 grid gap-3">
              {(
                Object.entries(CHECKOUT_DELIVERY_CONFIG.methods) as [
                  DeliveryMethod,
                  { label: string; price: number },
                ][]
              ).map(([id, method]) => {
                const price = calculateDeliveryPrice(id, subtotal);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-4 border p-4 transition ${deliveryMethod === id ? "border-[#354638] bg-white/35" : "border-black/15"}`}
                  >
                    <input
                      type="radio"
                      value={id}
                      {...register("deliveryMethod")}
                      className="mt-1 accent-[#354638]"
                    />
                    <span className="flex flex-1 justify-between gap-4">
                      <span>
                        <strong className="block text-sm">
                          {method.label}
                        </strong>
                        <span className="mt-1 block text-xs leading-5 text-stone-500">
                          {id === "pickup-khabarovsk"
                            ? "Согласуем удобное время после оплаты."
                            : "Итоговый срок зависит от региона."}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm">
                        {price === 0 ? "Бесплатно" : formatPrice(price)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl sm:text-4xl">
              Адрес получения
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Город" error={errors.city?.message}>
                <input
                  className="field-input"
                  autoComplete="address-level2"
                  {...register("city")}
                />
              </Field>
              <Field label="Индекс" error={errors.postalCode?.message}>
                <input
                  className="field-input"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  {...register("postalCode")}
                />
              </Field>
              {deliveryMethod !== "pickup-khabarovsk" ? (
                <div className="sm:col-span-2">
                  <Field
                    label="Адрес или пункт выдачи"
                    error={errors.address?.message}
                  >
                    <input
                      className="field-input"
                      autoComplete="street-address"
                      {...register("address")}
                    />
                  </Field>
                </div>
              ) : null}
              <Field
                label="Квартира или офис"
                error={errors.apartment?.message}
              >
                <input
                  className="field-input"
                  autoComplete="address-line2"
                  {...register("apartment")}
                />
              </Field>
            </div>
          </section>

          <section>
            <Field
              label="Комментарий к заказу"
              error={errors.customerComment?.message}
            >
              <textarea
                className="field-textarea"
                placeholder="Пожелания к упаковке или доставке"
                {...register("customerComment")}
              />
            </Field>
            <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#354638]"
                {...register("privacyAccepted")}
              />
              <span>
                Я соглашаюсь с{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="underline underline-offset-3"
                >
                  политикой обработки персональных данных
                </Link>{" "}
                и условиями публичной оферты.
              </span>
            </label>
            {errors.privacyAccepted ? (
              <p className="field-error">{errors.privacyAccepted.message}</p>
            ) : null}
          </section>
        </div>

        <aside className="h-fit bg-[#e8e1d5] p-6 sm:p-8 lg:sticky lg:top-32">
          <p className="eyebrow text-stone-500">Ваш заказ</p>
          <div className="mt-6 space-y-4 border-b border-black/10 pb-6">
            {details.map(({ product, quantity, variant }) => (
              <div
                key={`${product.id}-${variant}`}
                className="grid grid-cols-[62px_1fr_auto] gap-3 text-xs"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-200">
                  <Image
                    src={product.images[0].src}
                    alt=""
                    fill
                    sizes="62px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium leading-5">{product.name}</p>
                  <p className="mt-1 text-stone-500">× {quantity}</p>
                </div>
                <p className="text-right">
                  {formatPrice(product.price * quantity)}
                </p>
              </div>
            ))}
          </div>
          <dl className="space-y-3 border-b border-black/10 py-6 text-sm">
            <div className="flex justify-between">
              <dt>Товары</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Доставка</dt>
              <dd>
                {deliveryPrice === 0 ? "Бесплатно" : formatPrice(deliveryPrice)}
              </dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between py-6">
            <span className="font-display text-2xl">К оплате</span>
            <strong className="text-lg">{formatPrice(total)}</strong>
          </div>
          {serverError ? (
            <div
              role="alert"
              className="mb-5 border border-[#8d2f26]/30 bg-[#8d2f26]/5 p-4 text-xs leading-5 text-[#74271f]"
            >
              {serverError}
            </div>
          ) : null}
          <button
            type="submit"
            className="button-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <LockKeyhole size={15} />
            )}
            {isSubmitting ? "Создаём заказ…" : "Перейти к оплате"}
            {!isSubmitting ? <ArrowRight size={15} /> : null}
          </button>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            После проверки заказа вы перейдёте на защищённую страницу оплаты
            ЮKassa. Заказ считается оплаченным только после подтверждения
            платёжной системы.
          </p>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error block">{error}</span> : null}
    </label>
  );
}
