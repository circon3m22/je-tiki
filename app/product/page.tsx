import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog-view";
import { ProductOverlay } from "@/components/product-overlay";

export const metadata: Metadata = { title: "Изделие" };

export default function DynamicProductPage() {
  return (
    <main id="main-content" className="catalog-page section-shell">
      <div><CatalogView /></div>
      <Suspense><ProductOverlay /></Suspense>
    </main>
  );
}
