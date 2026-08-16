import type { DeliveryMethod } from "@/lib/validation/checkout";

/**
 * Initial fixed tariffs. Replace `calculateDeliveryPrice` with a CDEK-backed
 * implementation later without changing the checkout route contract.
 */
export const CHECKOUT_DELIVERY_CONFIG = {
  freeDeliveryFrom: 8_000,
  methods: {
    "pickup-khabarovsk": {
      label: "Самовывоз в Хабаровске",
      price: 0,
    },
    "cdek-pickup": {
      label: "СДЭК до пункта выдачи",
      price: 490,
    },
    "cdek-courier": {
      label: "СДЭК курьером",
      price: 790,
    },
    "russian-post": {
      label: "Почта России",
      price: 420,
    },
  } satisfies Record<DeliveryMethod, { label: string; price: number }>,
} as const;

export function calculateDeliveryPrice(
  method: DeliveryMethod,
  subtotal: number,
): number {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) {
    throw new RangeError("Invalid checkout subtotal.");
  }

  if (method === "pickup-khabarovsk") return 0;
  if (subtotal >= CHECKOUT_DELIVERY_CONFIG.freeDeliveryFrom) return 0;
  return CHECKOUT_DELIVERY_CONFIG.methods[method].price;
}

export function getDeliveryMethodLabel(method: DeliveryMethod): string {
  return CHECKOUT_DELIVERY_CONFIG.methods[method].label;
}

export function getDeliveryPricing(method: DeliveryMethod) {
  return {
    basePrice: CHECKOUT_DELIVERY_CONFIG.methods[method].price,
    freeDeliveryFrom: CHECKOUT_DELIVERY_CONFIG.freeDeliveryFrom,
  } as const;
}
