"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useSiteContent } from "@/components/site-content-provider";
import { BrandLogo } from "@/components/brand-logo";

export function Header() {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const about = useSiteContent("about");
  const isCatalog = pathname.startsWith("/catalog") || pathname.startsWith("/product");

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <div className="header-shell section-shell">
        <nav className="header-nav" aria-label="Основная навигация">
          <Link className="header-text-link" href="/catalog/" aria-current={isCatalog ? "page" : undefined}>Каталог</Link>
          {about && <Link className="header-text-link header-about-link" href="/#about">О мастерской</Link>}
        </nav>
        <Link className="wordmark" href="/" aria-label="JE TIKI — на главную">
          <BrandLogo className="wordmark-logo" />
        </Link>
        <button className="cart-trigger" type="button" onClick={openCart} aria-label={`Корзина, товаров: ${count}`}>
          <svg aria-hidden="true" className="header-bag" viewBox="0 0 24 24">
            <path d="M5 7h14l-1.2 12H6.2L5 7Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="cart-trigger-label">Корзина</span>
          <span className="header-cart-count tabular" aria-hidden="true">{count}</span>
        </button>
      </div>
    </header>
  );
}
