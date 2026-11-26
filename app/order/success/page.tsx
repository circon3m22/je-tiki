import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderSuccess } from "@/components/order-success";

export const metadata: Metadata = { title: "Статус заказа", robots: { index: false, follow: false } };

export default function OrderSuccessPage() {
  return (
    <main id="main-content" className="success-page section-shell">
      <Suspense fallback={<h1>Статус заказа</h1>}>
        <OrderSuccess />
      </Suspense>
      <Link className="primary-button inline" href="/catalog">Вернуться в каталог</Link>
    </main>
  );
}
