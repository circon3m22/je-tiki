"use client";

import { useSearchParams } from "next/navigation";
import { OrderStatus } from "@/components/order-status";

export function OrderStatusFromUrl() {
  const orderNumber = useSearchParams().get("order");
  return <OrderStatus orderNumber={orderNumber} />;
}
