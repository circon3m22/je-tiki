"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  count: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (slug: string, quantity?: number) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  prepareCheckout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "je-tiki-cart";
const MAX_QUANTITY = 99;

function sanitizeCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const slug = "slug" in item && typeof item.slug === "string" ? item.slug : "";
    const rawQuantity = "quantity" in item ? Number(item.quantity) : 0;
    if (!/^[a-z0-9-]+$/.test(slug) || !Number.isFinite(rawQuantity)) continue;
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(rawQuantity)));
    quantities.set(slug, Math.min(MAX_QUANTITY, (quantities.get(slug) ?? 0) + quantity));
  }
  return Array.from(quantities, ([slug, quantity]) => ({ slug, quantity }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const remoteCartId = useRef<string | null>(null);
  const linesRef = useRef<CartLine[]>([]);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(sanitizeCartLines(JSON.parse(saved)));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    let active = true;
    async function connectCart() {
      const { data: sessionData } = await client.auth.getSession();
      let user = sessionData.session?.user;
      if (!user) {
        const { data, error } = await client.auth.signInAnonymously();
        if (error || !data.user) return;
        user = data.user;
      }

      const { data: existing } = await client
        .from("carts")
        .select("id, cart_items(product_slug, quantity)")
        .eq("user_id", user.id)
        .maybeSingle();

      let cartId = existing?.id as string | undefined;
      if (!cartId) {
        const { data: created, error } = await client
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (error || !created) return;
        cartId = created.id as string;
      }

      if (!active) return;
      remoteCartId.current = cartId;
      const remoteLines = (existing?.cart_items ?? []) as Array<{
        product_slug: string;
        quantity: number;
      }>;
      if (lines.length === 0 && remoteLines.length > 0) {
        setLines(
          sanitizeCartLines(remoteLines.map((line) => ({ slug: line.product_slug, quantity: line.quantity }))),
        );
      }
      setRemoteReady(true);
    }

    void connectCart();
    return () => {
      active = false;
    };
    // Connect once after local hydration. Further updates are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!remoteReady || !remoteCartId.current) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const timeout = window.setTimeout(async () => {
      const cartId = remoteCartId.current;
      if (!cartId) return;

      if (lines.length === 0) {
        await supabase.from("cart_items").delete().eq("cart_id", cartId);
        return;
      }

      await supabase.from("cart_items").delete().eq("cart_id", cartId);
      await supabase.from("cart_items").upsert(
        lines.map((line) => ({
          cart_id: cartId,
          product_slug: line.slug,
          quantity: line.quantity,
        })),
        { onConflict: "cart_id,product_slug" },
      );
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [lines, remoteReady]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const addItem = useCallback((slug: string, quantity = 1) => {
    const normalizedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
    const safeQuantity = Math.min(MAX_QUANTITY, Math.max(1, normalizedQuantity));
    setLines((current) => {
      const line = current.find((item) => item.slug === slug);
      if (line) {
        return current.map((item) =>
          item.slug === slug
            ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + safeQuantity) }
            : item,
        );
      }
      return [...current, { slug, quantity: safeQuantity }];
    });
    setIsOpen(true);
  }, []);
  const updateQuantity = useCallback((slug: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    const safeQuantity = Math.min(MAX_QUANTITY, Math.floor(quantity));
    setLines((current) =>
      safeQuantity < 1
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) =>
            line.slug === slug ? { ...line, quantity: safeQuantity } : line,
          ),
    );
  }, []);
  const removeItem = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);
  const clearCart = useCallback(() => setLines([]), []);
  const prepareCheckout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("checkout_unavailable");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    let user = sessionData.session?.user;
    if (!user) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) throw error ?? new Error("anonymous_sign_in_failed");
      user = data.user;
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (cartError || !cart) throw cartError ?? new Error("cart_create_failed");

    const currentLines = linesRef.current;
    if (!currentLines.length) throw new Error("empty_cart");

    const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    if (clearError) throw clearError;

    const { error: itemsError } = await supabase.from("cart_items").insert(
      currentLines.map((line) => ({
        cart_id: cart.id,
        product_slug: line.slug,
        quantity: line.quantity,
      })),
    );
    if (itemsError) throw itemsError;

    remoteCartId.current = cart.id;
    setRemoteReady(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isOpen,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      prepareCheckout,
    }),
    [addItem, clearCart, closeCart, isOpen, lines, openCart, prepareCheckout, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
