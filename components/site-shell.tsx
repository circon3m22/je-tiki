"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SiteContentProvider } from "@/components/site-content-provider";
import { SiteMotion } from "@/components/site-motion";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = /(^|\/)admin(\/|$)/.test(pathname);

  if (isAdmin) return children;
  return (
    <CartProvider>
      <SiteContentProvider>
        <Header />
        {children}
        <SiteMotion />
        <Footer />
        <CartDrawer />
      </SiteContentProvider>
    </CartProvider>
  );
}
