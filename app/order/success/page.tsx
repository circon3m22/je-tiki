import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatus } from "@/components/order-status";
import { OrderStatusFromUrl } from "@/components/order-status-from-url";

export const metadata: Metadata = {
  title: "Статус заказа",
  robots: { index: false, follow: false },
};

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderStatus orderNumber={null} />}>
      <OrderStatusFromUrl />
    </Suspense>
  );
}
