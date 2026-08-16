"use client";

import Link from "next/link";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart/store";

type State = "checking" | "paid" | "pending" | "canceled" | "unavailable";

export function OrderStatus({ orderNumber }: { orderNumber: string | null }) {
  const [state, setState] = useState<State>(
    orderNumber ? "checking" : "unavailable",
  );
  const clear = useCartStore((value) => value.clear);

  useEffect(() => {
    if (!orderNumber) return;
    let attempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let canceled = false;

    async function check() {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber!)}/status`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          paymentStatus?: string;
        };
        if (canceled) return;
        if (response.ok && payload.ok) {
          if (payload.paymentStatus === "paid") {
            clear();
            setState("paid");
            return;
          }
          if (payload.paymentStatus === "canceled") {
            setState("canceled");
            return;
          }
          setState("pending");
          if (attempts < 4) timeout = setTimeout(check, 3500);
          return;
        }
        setState("unavailable");
      } catch {
        if (!canceled) setState("unavailable");
      }
    }

    void check();
    return () => {
      canceled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [clear, orderNumber]);

  const content = {
    checking: {
      icon: (
        <LoaderCircle size={42} strokeWidth={1.2} className="animate-spin" />
      ),
      eyebrow: "Проверяем оплату",
      title: "Один момент",
      text: "Получаем подтверждение от платёжной системы. Не закрывайте страницу.",
    },
    paid: {
      icon: <Check size={42} strokeWidth={1.2} />,
      eyebrow: "Оплата подтверждена",
      title: "Спасибо за заказ",
      text: "Мы получили оплату и начали обработку заказа. Сохраните номер заказа — при необходимости мы свяжемся по указанным контактам.",
    },
    pending: {
      icon: <LoaderCircle size={42} strokeWidth={1.2} />,
      eyebrow: "Платёж обрабатывается",
      title: "Заказ принят",
      text: "Платёжная система ещё не подтвердила оплату. Статус обновится автоматически; при необходимости вернитесь на эту страницу позже.",
    },
    canceled: {
      icon: <CircleAlert size={42} strokeWidth={1.2} />,
      eyebrow: "Оплата отменена",
      title: "Платёж не завершён",
      text: "Деньги не списаны. Вы можете вернуться в корзину и повторить оформление.",
    },
    unavailable: {
      icon: <CircleAlert size={42} strokeWidth={1.2} />,
      eyebrow: "Статус недоступен",
      title: orderNumber
        ? "Не удалось проверить заказ"
        : "Номер заказа не указан",
      text: orderNumber
        ? "Сервис временно недоступен. Попробуйте открыть эту страницу ещё раз позже."
        : "Вернитесь в корзину и начните оформление заказа.",
    },
  }[state];

  return (
    <div className="site-container flex min-h-[72vh] items-center justify-center py-20 text-center">
      <div className="max-w-2xl">
        <div className="mx-auto mb-7 flex size-20 items-center justify-center rounded-full border border-black/20">
          {content.icon}
        </div>
        <p className="eyebrow text-stone-500">{content.eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-stone-600">
          {content.text}
        </p>
        {orderNumber ? (
          <p className="mt-5 text-xs tracking-[0.12em]">Заказ {orderNumber}</p>
        ) : null}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/catalog" className="button-primary">
            Вернуться в каталог
          </Link>
          {state !== "paid" ? (
            <Link href="/cart" className="button-secondary">
              Открыть корзину
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
