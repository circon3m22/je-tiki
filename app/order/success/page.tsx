import Link from "next/link";
import { Suspense } from "react";
import { OrderSuccess } from "@/components/order-success";

export default function OrderSuccessPage() {
  return (
    <main id="main-content" className="success-page section-shell">
      <h1>Заказ принят</h1>
      <Suspense>
        <OrderSuccess />
      </Suspense>
      <Link className="primary-button inline" href="/catalog">Вернуться в каталог</Link>
    </main>
  );
}
