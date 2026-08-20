"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

export type HomeCollection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImage: string | StaticImageData;
  products: Product[];
};

export function CollectionShowcase({ collection }: { collection: HomeCollection }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const dragRef = useRef({ startX: 0, lastX: 0, moved: false, active: false, pointerDown: false, pointerId: -1 });
  const [dragging, setDragging] = useState(false);

  const normalizeScroll = () => {
    const viewport = viewportRef.current;
    const setWidth = setWidthRef.current;
    if (!viewport || !setWidth) return;
    if (viewport.scrollLeft >= setWidth * 2) viewport.scrollLeft -= setWidth;
    else if (viewport.scrollLeft <= 1) viewport.scrollLeft += setWidth;
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstSet = firstSetRef.current;
    if (!viewport || !firstSet || !collection.products.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      reducedMotionRef.current = reducedMotion.matches;
    };
    syncReducedMotion();
    reducedMotion.addEventListener("change", syncReducedMotion);
    const measure = () => {
      setWidthRef.current = firstSet.getBoundingClientRect().width;
      if (setWidthRef.current && (viewport.scrollLeft < 1 || viewport.scrollLeft >= setWidthRef.current * 2)) {
        viewport.scrollLeft = setWidthRef.current;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(firstSet);

    let previous = performance.now();
    const tick = () => {
      const now = performance.now();
      const elapsed = Math.min(now - previous, 40);
      previous = now;
      if (!reducedMotionRef.current && !dragRef.current.active && setWidthRef.current) {
        viewport.scrollLeft += elapsed * 0.045;
        normalizeScroll();
      }
    };
    const timer = window.setInterval(tick, 16);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncReducedMotion);
      window.clearInterval(timer);
    };
    // Re-measure when the contents of the repeated set change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.products.length]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !viewportRef.current) return;
    dragRef.current = {
      startX: event.clientX,
      lastX: event.clientX,
      moved: false,
      active: false,
      pointerDown: true,
      pointerId: event.pointerId,
    };
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.pointerDown || !viewportRef.current) return;
    const distance = Math.abs(event.clientX - dragRef.current.startX);
    if (!dragRef.current.active && distance < 8) {
      dragRef.current.lastX = event.clientX;
      return;
    }
    if (!dragRef.current.active) {
      dragRef.current.active = true;
      dragRef.current.moved = true;
      viewportRef.current.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    const delta = event.clientX - dragRef.current.lastX;
    viewportRef.current.scrollLeft -= delta;
    dragRef.current.lastX = event.clientX;
    normalizeScroll();
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const wasMoved = dragRef.current.moved;
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) viewportRef.current.releasePointerCapture(event.pointerId);
    dragRef.current.active = false;
    dragRef.current.pointerDown = false;
    setDragging(false);
    if (wasMoved) window.setTimeout(() => { dragRef.current.moved = false; }, 0);
  };
  const preventClickAfterDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  };

  return (
    <article className="collection-showcase">
      <div className="collection-showcase-hero">
        <Image
          src={collection.heroImage}
          alt={`Коллекция «${collection.name}»`}
          fill
          sizes="100vw"
          className="collection-showcase-image"
        />
      </div>
      <div className="collection-showcase-copy section-shell">
        <div>
          <h3>{collection.name}</h3>
        </div>
        <p>{collection.description}</p>
        <div className="collection-showcase-actions">
          <Link className="collection-catalog-link" href="/catalog">Смотреть в каталоге</Link>
        </div>
      </div>
      {!!collection.products.length && (
        <div className="collection-marquee" data-dragging={dragging || undefined}>
          <div
            className="collection-marquee-viewport"
            ref={viewportRef}
            role="region"
            aria-label={`Товары коллекции «${collection.name}»`}
            tabIndex={0}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onClickCapture={preventClickAfterDrag}
            onScroll={normalizeScroll}
          >
            <div className="collection-marquee-track">
              <div className="collection-marquee-set" ref={firstSetRef}>
                {collection.products.map((product) => (
                  <div className="collection-marquee-item" key={`before-${product.slug}`}>
                    <ProductCard product={product} quickAdd duplicate />
                  </div>
                ))}
              </div>
              <div className="collection-marquee-set">
                {collection.products.map((product) => (
                  <div className="collection-marquee-item" key={product.slug}>
                    <ProductCard product={product} quickAdd />
                  </div>
                ))}
              </div>
              <div className="collection-marquee-set">
                {collection.products.map((product) => (
                  <div className="collection-marquee-item" key={`after-${product.slug}`}>
                    <ProductCard product={product} quickAdd duplicate />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
