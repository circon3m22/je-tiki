import Link from "next/link";
import { Suspense } from "react";
import { OrderSuccess } from "@/components/order-success";

export default function OrderSuccessPage() {
  return (
    <main id="main-content" className="success-page section-shell">
      <p className="eyebrow">Заказ принят</p>
      <h1>Спасибо за ваш выбор.</h1>
      <Suspense fallback={<p>Заказ принят. Номер отправлен на вашу электронную почту.</p>}>
        <OrderSuccess />
      </Suspense>
      <Link className="primary-button inline" href="/catalog">Вернуться в каталог</Link>
    </main>
  );
}
