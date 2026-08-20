"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { BrandLogo } from "@/components/brand-logo";

export function Header() {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const isHome = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const logo = logoRef.current;
    if (!header || !logo) return;
    const hero = isHome ? document.querySelector<HTMLElement>(".hero") : null;

    let frame = 0;
    let lastFrameTime = 0;
    let targetScroll = Math.max(0, window.scrollY);
    let renderedScroll = targetScroll;
    let lastWidth = window.innerWidth;
    let mobile = lastWidth <= 768;
    let top = mobile ? 32 : 36;
    let range = 360;
    let startScale = 1;
    let endScale = 1;
    let startCenter = top;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncGeometry = () => {
      const width = window.innerWidth;
      lastWidth = width;
      mobile = width <= 768;
      top = mobile ? 32 : 36;
      const stableHeroHeight = hero?.offsetHeight || window.innerHeight;
      range = Math.max(360, stableHeroHeight * 0.68);
      startScale = mobile
        ? Math.min(3.1, (width * 0.72) / 116)
        : Math.min(6.2, (width * 0.52) / 116);
      endScale = mobile ? 0.78 : 1;
      startCenter = stableHeroHeight * (mobile ? 0.36 : 0.4);
    };

    const render = (scrollPosition: number) => {
      if (!isHome) {
        logo.style.top = `${top}px`;
        logo.style.transform = `translate3d(-50%, -50%, 0) scale(${mobile ? 0.78 : 1})`;
        header.classList.add("site-header--solid");
        header.classList.remove("site-header--overlay");
        return;
      }

      const raw = Math.min(1, Math.max(0, scrollPosition / range));
      const progress = reducedMotion.matches ? (raw > 0.12 ? 1 : 0) : raw * raw * (3 - 2 * raw);
      const offset = (startCenter - top) * (1 - progress);
      const scale = startScale + (endScale - startScale) * progress;
      const solid = progress > 0.82;

      logo.style.top = `${top}px`;
      logo.style.transform = `translate3d(-50%, -50%, 0) translate3d(0, ${offset}px, 0) scale(${scale})`;
      header.classList.toggle("site-header--solid", solid);
      header.classList.toggle("site-header--overlay", !solid);

      if (hero) {
        const copyRange = mobile ? 120 : 180;
        const copyOpacity = reducedMotion.matches
          ? (scrollPosition > 24 ? 0 : 1)
          : Math.max(0, 1 - scrollPosition / copyRange);
        const parallax = reducedMotion.matches ? 0 : scrollPosition * (mobile ? 0.14 : 0.32);
        const copyShift = reducedMotion.matches ? 0 : scrollPosition * -0.06;
        hero.style.setProperty("--hero-parallax-y", `${parallax}px`);
        hero.style.setProperty("--hero-copy-opacity", String(copyOpacity));
        hero.style.setProperty("--hero-copy-shift", `${copyShift}px`);
      }
    };

    const animate = (time: number) => {
      const elapsed = lastFrameTime ? Math.min(48, time - lastFrameTime) : 16;
      lastFrameTime = time;
      const smoothing = 1 - Math.exp(-elapsed / 58);
      renderedScroll += (targetScroll - renderedScroll) * smoothing;
      if (Math.abs(targetScroll - renderedScroll) < 0.1) renderedScroll = targetScroll;
      render(renderedScroll);

      if (renderedScroll !== targetScroll) {
        frame = window.requestAnimationFrame(animate);
      } else {
        frame = 0;
        lastFrameTime = 0;
      }
    };

    const requestUpdate = () => {
      targetScroll = Math.max(0, window.scrollY);
      if (reducedMotion.matches) {
        renderedScroll = targetScroll;
        render(renderedScroll);
        return;
      }
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const widthChanged = Math.abs(window.innerWidth - lastWidth) > 1;
      if (widthChanged || !mobile) syncGeometry();
      requestUpdate();
    };

    syncGeometry();
    render(renderedScroll);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isHome]);

  return (
    <header
      ref={headerRef}
      className={`site-header site-header--fixed${isHome ? " site-header--home site-header--overlay" : " site-header--solid"}`}
    >
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>

      <Link className="desktop-catalog-link header-text-link" href="/catalog">Каталог</Link>
      <Link className="mobile-catalog-link header-icon-button" href="/catalog" aria-label="Открыть каталог">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="4" y="4" width="6" height="6" rx="0.6" />
          <rect x="14" y="4" width="6" height="6" rx="0.6" />
          <rect x="4" y="14" width="6" height="6" rx="0.6" />
          <rect x="14" y="14" width="6" height="6" rx="0.6" />
        </svg>
      </Link>

      <Link ref={logoRef} className="wordmark wordmark--morphing" href="/" aria-label="JE TIKI — на главную">
        <BrandLogo className="wordmark-logo" />
      </Link>

      <button className="cart-trigger desktop-cart-trigger" type="button" onClick={openCart}>
        Корзина <span className="tabular">({count})</span>
      </button>
      <button className="mobile-cart-trigger header-icon-button" type="button" onClick={openCart} aria-label={`Открыть корзину, товаров: ${count}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 7h14l-1.2 12H6.2L5 7Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        {count > 0 && <span className="mobile-cart-count tabular">{count}</span>}
      </button>
    </header>
  );
}
