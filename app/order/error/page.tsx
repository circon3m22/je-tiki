import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Оплата не завершена",
  robots: { index: false, follow: false },
};

export default function OrderErrorPage() {
  return (
    <div className="site-container flex min-h-[70vh] items-center justify-center py-20 text-center">
      <div className="max-w-xl">
        <CircleAlert size={48} strokeWidth={1.1} className="mx-auto mb-7" />
        <p className="eyebrow text-stone-500">Оплата не завершена</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl">
          Попробуйте ещё раз
        </h1>
        <p className="mt-6 text-sm leading-7 text-stone-600">
          Деньги не списаны. Состав заказа сохранён в корзине — вы можете
          проверить данные и повторить оформление.
        </p>
        <Link href="/checkout" className="button-primary mt-9">
          Вернуться к оформлению
        </Link>
      </div>
    </div>
  );
}
