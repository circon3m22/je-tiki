import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Серьги, подвески, браслеты и сувениры JE TIKI из дальневосточного дерева.",
  alternates: { canonical: "/catalog" },
};

export default function CatalogPage() {
  return <main id="main-content" className="catalog-page section-shell"><CatalogView /></main>;
}
