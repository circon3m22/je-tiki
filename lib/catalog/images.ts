import type { LocalProductSlug, ProductImage } from "@/lib/types/catalog";

export const PRODUCT_IMAGE_LIBRARY = {
  heroWoodSilver: {
    src: "/images/hero-silver-jewelry-wood.webp",
    alt: "Серебряное украшение рядом с натуральным деревом",
    namesProduct: false,
  },
  silverOnStone: {
    src: "/images/product-ring-stone.webp",
    alt: "Серебряная деталь на светлом камне, крупный план",
    namesProduct: true,
  },
  silverOnHand: {
    src: "/images/product-ring-hand.webp",
    alt: "Серебряное украшение на руке",
    namesProduct: true,
  },
  pendantShadow: {
    src: "/images/product-necklace-shadow.webp",
    alt: "Подвеска в мягком естественном свете",
    namesProduct: true,
  },
  pendantWorn: {
    src: "/images/product-necklace-worn.webp",
    alt: "Подвеска на человеке",
    namesProduct: true,
  },
  darkEarrings: {
    src: "/images/product-earrings-dark.webp",
    alt: "Тёмные серьги с выразительной природной фактурой",
    namesProduct: true,
  },
  wornEarrings: {
    src: "/images/product-earrings-worn.webp",
    alt: "Лаконичные серьги на человеке",
    namesProduct: true,
  },
  workshop: {
    src: "/images/editorial-jewelry-workshop.webp",
    alt: "Рабочее место в ювелирной мастерской",
    namesProduct: false,
  },
  workbench: {
    src: "/images/editorial-jewelry-workbench.webp",
    alt: "Инструменты и материалы на верстаке",
    namesProduct: false,
  },
  craftHands: {
    src: "/images/editorial-craft-hands.webp",
    alt: "Ручная обработка небольшой детали",
    namesProduct: false,
  },
  woodCarving: {
    src: "/images/editorial-wood-carving.webp",
    alt: "Точная ручная обработка древесины",
    namesProduct: false,
  },
  woodGrain: {
    src: "/images/editorial-wood-grain.webp",
    alt: "Естественный рисунок древесных волокон",
    namesProduct: false,
  },
  woodShavings: {
    src: "/images/editorial-wood-shavings.webp",
    alt: "Древесная стружка после ручной обработки",
    namesProduct: false,
  },
  giftPackaging: {
    src: "/images/editorial-gift-packaging.webp",
    alt: "Минималистичная подарочная упаковка для украшения",
    namesProduct: false,
  },
} as const;

export type ProductImageAssetKey = keyof typeof PRODUCT_IMAGE_LIBRARY;

export const PRODUCT_IMAGE_SETS = {
  "tikhaya-bukhta": [
    "darkEarrings",
    "wornEarrings",
    "woodGrain",
    "craftHands",
    "giftPackaging",
  ],
  "severny-veter": [
    "wornEarrings",
    "darkEarrings",
    "silverOnStone",
    "workbench",
    "giftPackaging",
  ],
  "svet-nad-amurom": [
    "darkEarrings",
    "wornEarrings",
    "heroWoodSilver",
    "woodGrain",
    "giftPackaging",
  ],
  "kedrovaya-liniya": [
    "wornEarrings",
    "darkEarrings",
    "craftHands",
    "woodCarving",
    "giftPackaging",
  ],
  istok: [
    "pendantShadow",
    "pendantWorn",
    "woodGrain",
    "workshop",
    "giftPackaging",
  ],
  "tuman-nad-morem": [
    "pendantWorn",
    "pendantShadow",
    "heroWoodSilver",
    "craftHands",
    "giftPackaging",
  ],
  techenie: [
    "pendantShadow",
    "pendantWorn",
    "silverOnStone",
    "woodCarving",
    "giftPackaging",
  ],
  "kamenny-bereg": [
    "silverOnHand",
    "silverOnStone",
    "woodGrain",
    "craftHands",
    "giftPackaging",
  ],
  "taezhnaya-tropa": [
    "silverOnStone",
    "silverOnHand",
    "woodCarving",
    "woodGrain",
    "giftPackaging",
  ],
  polden: [
    "silverOnHand",
    "silverOnStone",
    "heroWoodSilver",
    "workbench",
    "giftPackaging",
  ],
  mayak: [
    "woodCarving",
    "woodGrain",
    "woodShavings",
    "craftHands",
    "giftPackaging",
  ],
  "sled-taygi": [
    "woodGrain",
    "woodCarving",
    "craftHands",
    "workbench",
    "giftPackaging",
  ],
  "rechnoy-kamen": [
    "woodCarving",
    "woodShavings",
    "woodGrain",
    "silverOnStone",
    "giftPackaging",
  ],
  gorizont: [
    "heroWoodSilver",
    "woodGrain",
    "woodCarving",
    "workshop",
    "giftPackaging",
  ],
  "teply-bereg": [
    "giftPackaging",
    "heroWoodSilver",
    "pendantShadow",
    "woodGrain",
    "craftHands",
  ],
} as const satisfies Record<LocalProductSlug, readonly ProductImageAssetKey[]>;

export function getProductImages(
  slug: LocalProductSlug,
  productName: string,
): readonly ProductImage[] {
  return PRODUCT_IMAGE_SETS[slug].map((assetKey, index) => {
    const asset = PRODUCT_IMAGE_LIBRARY[assetKey];
    return {
      id: `local-${slug}-${index + 1}`,
      src: asset.src,
      alt: asset.namesProduct ? `${productName}. ${asset.alt}` : asset.alt,
      sortOrder: index,
    };
  });
}
