import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CartPageClient } from "@/components/cart-page-client";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Корзина выбранных изделий Je Tiki.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Корзина" }]} />
      <CartPageClient />
    </>
  );
}
