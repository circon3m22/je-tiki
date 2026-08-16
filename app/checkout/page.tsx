import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа Je Tiki.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Корзина", href: "/cart" }, { label: "Оформление" }]}
      />
      <CheckoutForm />
    </>
  );
}
