import type { Product } from "@/lib/types/catalog";

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  currencyDisplay: "symbol",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

export function formatPriceRange(min: number, max: number): string {
  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)} — ${formatPrice(max)}`;
}

export function formatWeight(grams: number): string {
  return `${numberFormatter.format(grams)} г`;
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
}

export function formatProductAvailability(
  product: Pick<Product, "isAvailable" | "stock" | "productionTime">,
): string {
  if (!product.isAvailable) return "Нет в наличии";
  if (product.stock > 0) return "В наличии";
  return `Изготовим на заказ · ${product.productionTime}`;
}

export function formatSku(sku: string): string {
  return `Артикул ${sku}`;
}
