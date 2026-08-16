"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variant: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  addItem: (
    productId: string,
    options?: { quantity?: number; variant?: string; max?: number },
  ) => void;
  removeItem: (productId: string, variant?: string) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    options?: { variant?: string; max?: number },
  ) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setHydrated: (value: boolean) => void;
}

const DEFAULT_VARIANT = "default";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      addItem: (productId, options = {}) =>
        set((state) => {
          const variant = options.variant ?? DEFAULT_VARIANT;
          const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
          const max = Math.max(1, options.max ?? Number.MAX_SAFE_INTEGER);
          const current = state.items.find(
            (item) => item.productId === productId && item.variant === variant,
          );

          if (current) {
            return {
              items: state.items.map((item) =>
                item === current
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, max),
                    }
                  : item,
              ),
              isOpen: true,
            };
          }

          return {
            items: [
              ...state.items,
              { productId, variant, quantity: Math.min(quantity, max) },
            ],
            isOpen: true,
          };
        }),
      removeItem: (productId, variant = DEFAULT_VARIANT) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variant === variant),
          ),
        })),
      setQuantity: (productId, quantity, options = {}) =>
        set((state) => {
          const variant = options.variant ?? DEFAULT_VARIANT;
          const max = Math.max(1, options.max ?? Number.MAX_SAFE_INTEGER);
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) =>
                  !(item.productId === productId && item.variant === variant),
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId && item.variant === variant
                ? { ...item, quantity: Math.min(Math.floor(quantity), max) }
                : item,
            ),
          };
        }),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "je-tiki-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    },
  ),
);

export function getCartCount(items: readonly CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
