"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { localProducts } from "@/lib/catalog";
import { getCartCount, useCartStore } from "@/lib/cart/store";
import { BrandLogo } from "@/components/brand-logo";
import { CartDrawer } from "@/components/cart-drawer";

const primaryLinks = [
  { href: "/catalog", label: "Коллекция" },
  { href: "/materials", label: "Материалы" },
  { href: "/about", label: "О бренде" },
  { href: "/delivery", label: "Доставка" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { items, open, hasHydrated } = useCartStore();
  const count = hasHydrated ? getCartCount(items) : 0;
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");
    if (normalized.length < 2) return [];
    return localProducts
      .filter((product) =>
        [
          product.name,
          product.shortDescription,
          product.woodType ?? "",
          ...product.materials,
        ]
          .join(" ")
          .toLocaleLowerCase("ru-RU")
          .includes(normalized),
      )
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner site-container grid h-[76px] grid-cols-[88px_minmax(0,1fr)_88px] items-center gap-0 lg:h-[88px] lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Основная навигация"
          >
            {primaryLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                aria-current={
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "page"
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="justify-self-start lg:hidden">
            <button
              type="button"
              className="icon-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>

          <Link
            href="/"
            className="inline-flex justify-self-center"
            aria-label="Je Tiki — главная"
          >
            <BrandLogo
              tone="dark"
              className="w-[108px] sm:w-[116px]"
              priority
            />
          </Link>

          <nav
            className="hidden items-center justify-end gap-7 lg:flex"
            aria-label="Дополнительная навигация"
          >
            {primaryLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                aria-current={
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "page"
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center">
              <button
                type="button"
                className="icon-button"
                onClick={() => setSearchOpen(true)}
                aria-label="Открыть поиск"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="icon-button relative"
                onClick={open}
                aria-label={`Открыть корзину, товаров: ${count}`}
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {count > 0 ? <span className="cart-count">{count}</span> : null}
              </button>
            </div>
          </nav>

          <div className="flex items-center justify-end lg:hidden">
            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Открыть поиск"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="icon-button relative"
              onClick={open}
              aria-label={`Открыть корзину, товаров: ${count}`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 ? <span className="cart-count">{count}</span> : null}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <BrandLogo tone="dark" className="w-[132px]" />
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
          >
            <X size={23} strokeWidth={1.5} />
          </button>
        </div>
        <nav
          className="flex flex-1 flex-col justify-center px-6 py-10"
          aria-label="Мобильная навигация"
        >
          {[
            ...primaryLinks,
            { href: "/care", label: "Уход" },
            { href: "/contacts", label: "Контакты" },
          ].map((link, index) => (
            <Link
              href={link.href}
              key={link.href}
              className="border-b border-black/10 py-4 font-display text-[clamp(2rem,10vw,3.5rem)] leading-none text-[#111412]"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mr-4 align-top font-sans text-[10px] tracking-[0.2em] text-black/35">
                0{index + 1}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        className={`search-overlay ${searchOpen ? "is-open" : ""}`}
        aria-hidden={!searchOpen}
      >
        <div className="site-container py-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Поиск по коллекции</p>
            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(false)}
              aria-label="Закрыть поиск"
            >
              <X size={23} strokeWidth={1.5} />
            </button>
          </div>
          <div className="mx-auto mt-[10vh] max-w-3xl">
            <label htmlFor="site-search" className="sr-only">
              Найти изделие
            </label>
            <div className="flex items-center border-b border-black pb-3">
              <Search size={25} strokeWidth={1.2} className="mr-4 shrink-0" />
              <input
                id="site-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название, материал или порода дерева"
                className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-stone-400 sm:text-5xl"
                autoFocus={searchOpen}
              />
            </div>
            <div className="mt-8" aria-live="polite">
              {query.trim().length >= 2 && results.length === 0 ? (
                <p className="text-sm text-stone-600">
                  Ничего не найдено. Попробуйте изменить запрос.
                </p>
              ) : (
                results.map((product) => (
                  <Link
                    href={`/product/${product.slug}`}
                    key={product.id}
                    className="flex items-center justify-between border-b border-black/10 py-4 text-sm transition hover:pl-2"
                    onClick={() => setSearchOpen(false)}
                  >
                    <span>{product.name}</span>
                    <span className="text-stone-500">{product.woodType}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <CartDrawer />
    </>
  );
}
