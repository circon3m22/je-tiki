"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = /(^|\/)admin(\/|$)/.test(pathname);

  if (isAdmin) return children;
  return <>
    <Header />
    {children}
    <Footer />
    <CartDrawer />
  </>;
}
