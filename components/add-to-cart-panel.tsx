"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types/catalog";
import { useCartStore } from "@/lib/cart/store";

export function AddToCartPanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const max = Math.max(1, product.stock || 1);
  const unavailable = !product.isAvailable;

  function add() {
    if (unavailable) return;
    addItem(product.id, { quantity, max });
  }

  return (
    <>
      <div className="flex gap-3">
        <div className="quantity-control shrink-0">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Уменьшить количество"
          >
            <Minus size={15} />
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={quantity >= max}
            aria-label="Увеличить количество"
          >
            <Plus size={15} />
          </button>
        </div>
        <button
          type="button"
          className="button-primary flex-1"
          onClick={add}
          disabled={unavailable}
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {unavailable ? "Нет в наличии" : "Добавить в корзину"}
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f3efe6]/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          className="button-primary w-full"
          onClick={add}
          disabled={unavailable}
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {unavailable ? "Нет в наличии" : "Добавить в корзину"}
        </button>
      </div>
    </>
  );
}
