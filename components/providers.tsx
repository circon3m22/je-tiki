"use client";

import { useEffect, type ReactNode } from "react";
import { useCartStore } from "@/lib/cart/store";

export function Providers({ children }: { children: ReactNode }) {
  const setHydrated = useCartStore((state) => state.setHydrated);

  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).finally(() =>
      setHydrated(true),
    );
  }, [setHydrated]);

  return children;
}
