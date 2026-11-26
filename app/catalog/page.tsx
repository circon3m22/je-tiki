import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";

import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Серьги, подвески, браслеты и сувениры JE TIKI из дальневосточного дерева.",
  alternates: { canonical: siteUrl("/catalog/") },
};

export default function CatalogPage() {
  return <main id="main-content" className="catalog-page section-shell"><CatalogView /></main>;
}
