import type { Category } from "@/lib/types/catalog";

export const categories = [
  {
    slug: "earrings",
    name: "Серьги",
    singularName: "Серьги",
    description:
      "Лёгкие формы из дерева и серебра, в которых природный рисунок становится частью силуэта.",
    image: "/images/product-earrings-dark.webp",
    imageAlt: "Серьги с деталями из натурального дерева",
    sortOrder: 1,
  },
  {
    slug: "pendants",
    name: "Подвески",
    singularName: "Подвеска",
    description:
      "Выразительные, но сдержанные подвески с тёплой фактурой дерева и холодным блеском серебра.",
    image: "/images/product-necklace-shadow.webp",
    imageAlt: "Минималистичная подвеска в мягком свете",
    sortOrder: 2,
  },
  {
    slug: "bracelets",
    name: "Браслеты",
    singularName: "Браслет",
    description:
      "Тактильные украшения для запястья, собранные вручную из древесины и серебряных деталей.",
    image: "/images/product-ring-hand.webp",
    imageAlt: "Серебряное украшение на руке",
    sortOrder: 3,
  },
  {
    slug: "keychains",
    name: "Брелоки",
    singularName: "Брелок",
    description:
      "Небольшие повседневные предметы с живой древесной фактурой и надёжной металлической фурнитурой.",
    image: "/images/editorial-wood-carving.webp",
    imageAlt: "Небольшая деталь из дерева в процессе обработки",
    sortOrder: 4,
  },
  {
    slug: "gifts",
    name: "Подарки",
    singularName: "Подарок",
    description:
      "Небольшие предметы и готовые наборы, которые можно подарить сразу — упаковка уже включена.",
    image: "/images/editorial-gift-packaging.webp",
    imageAlt: "Лаконичная подарочная упаковка",
    sortOrder: 5,
  },
] as const satisfies readonly Category[];

export function getCategory(slug: string): Category | null {
  return categories.find((category) => category.slug === slug) ?? null;
}
