"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "@/components/icons";
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

export function CollectionShowcase({ collection, index }: { collection: HomeCollection; index: number }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railId = useId();
  const [edges, setEdges] = useState({ start: true, end: true });
  const sentences = collection.description.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [collection.description];
  const expandedStory = collection.description.length > 280 && sentences.length > 1;

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const measure = () => setEdges({
      start: viewport.scrollLeft <= 2,
      end: viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2,
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    viewport.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", measure);
    };
  }, [collection.products.length]);

  const move = (direction: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap) : viewport.clientWidth * .8;
    viewport.scrollBy({ left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <article className={`collection-showcase${index % 2 ? " collection-showcase--reverse" : ""}`}>
      <div className="collection-editorial section-shell">
        <div className="collection-showcase-hero" data-reveal>
          <Image src={collection.heroImage} alt={`Коллекция «${collection.name}»`} fill sizes="(max-width: 768px) 100vw, 56vw" className="collection-showcase-image" />
          <span className="collection-image-note" aria-hidden="true">JE TIKI · {String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="collection-showcase-copy" data-reveal>
          <p className="collection-number"><span>{String(index + 1).padStart(2, "0")}</span> Коллекция</p>
          <h3>{collection.name}</h3>
          <p className="collection-description">{expandedStory ? sentences[0].trim() : collection.description}</p>
          {expandedStory && <details className="collection-story"><summary>История коллекции</summary><p>{sentences.slice(1).join("").trim()}</p></details>}
          <Link className="collection-catalog-link" href={`/catalog?collection=${encodeURIComponent(collection.name)}`}>
            Смотреть коллекцию <ArrowIcon className="arrow-icon" />
          </Link>
        </div>
      </div>
      {collection.products.length > 0 && (
        <div className="collection-products section-shell">
          <div className="collection-rail-heading">
            <p>Предметы коллекции <span className="tabular">/ {String(collection.products.length).padStart(2, "0")}</span></p>
            <div className="rail-controls" role="group" aria-label={`Листать коллекцию «${collection.name}»`}>
              <button type="button" className="rail-button rail-button--previous" aria-label="Предыдущие предметы" aria-controls={railId} disabled={edges.start} onClick={() => move(-1)}><ArrowIcon className="arrow-icon" /></button>
              <button type="button" className="rail-button" aria-label="Следующие предметы" aria-controls={railId} disabled={edges.end} onClick={() => move(1)}><ArrowIcon className="arrow-icon" /></button>
            </div>
          </div>
          <div id={railId} className="collection-rail" ref={viewportRef} role="region" aria-label={`Товары коллекции «${collection.name}»`} tabIndex={0}>
            <div className="collection-rail-track" ref={trackRef}>
              {collection.products.map((product) => <ProductCard key={product.slug} product={product} quickAdd />)}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
