"use client";

import { useSearchParams } from "next/navigation";
import { CatalogClient } from "@/components/catalog-client";
import type { Product } from "@/lib/types/catalog";

export function CatalogSearchSummary() {
  const search = useSearchParams().get("search") ?? "";

  return search ? (
    <p className="mt-7 text-sm">
      Результаты по запросу: <strong>«{search}»</strong>
    </p>
  ) : null;
}

export function SearchableCatalog({
  products,
}: {
  products: readonly Product[];
}) {
  const search = useSearchParams().get("search") ?? "";
  return <CatalogClient products={products} initialSearch={search} />;
}
