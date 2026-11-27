import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductOverlay } from "@/components/product-overlay";

export const metadata: Metadata = { title: "Изделие" };

export default function DynamicProductPage() {
  return (
    <main id="main-content" className="product-page">
      <Suspense fallback={<div className="product-route-loading" role="status">Загружаем товар…</div>}><ProductOverlay /></Suspense>
    </main>
  );
}
