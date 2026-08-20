import { CatalogView } from "@/components/catalog-view";
import { ProductOverlay } from "@/components/product-overlay";

export default function DynamicProductPage() {
  return (
    <main id="main-content" className="catalog-page section-shell">
      <CatalogView />
      <ProductOverlay />
    </main>
  );
}
