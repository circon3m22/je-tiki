import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogClient } from "@/components/catalog-client";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог украшений",
  description:
    "Серьги, подвески, браслеты, брелоки и подарочные изделия Je Tiki из дерева и серебра.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  const products = await getProducts();

  return (
    <>
      <Breadcrumbs items={[{ label: "Каталог" }]} />
      <header className="site-container pb-12 pt-8 sm:pb-16 sm:pt-14">
        <p className="eyebrow mb-5 text-stone-500">Коллекция Je Tiki</p>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <h1 className="display-title">Все изделия</h1>
          <p className="max-w-lg text-sm leading-7 text-stone-600 lg:justify-self-end">
            Дерево выбирает рисунок, мастер задаёт форму. Найдите изделие,
            которое останется с вами надолго.
          </p>
        </div>
        {search ? (
          <p className="mt-7 text-sm">
            Результаты по запросу: <strong>«{search}»</strong>
          </p>
        ) : null}
      </header>
      <CatalogClient products={products} initialSearch={search} />
    </>
  );
}
