import type { Metadata } from "next";
import { OrderStatus } from "@/components/order-status";

export const metadata: Metadata = {
  title: "Статус заказа",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order = null } = await searchParams;
  return <OrderStatus orderNumber={order} />;
}
