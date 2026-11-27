"use client";

import Image from "next/image";
import { useId, useRef, useState, type PointerEvent } from "react";
import { assetPath } from "@/lib/asset-path";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startScroll: number } | null>(null);
  const [current, setCurrent] = useState(0);
  const viewportId = useId();
  const multiple = images.length > 1;

  function goTo(index: number) {
    const gallery = viewport.current;
    if (!gallery) return;
    const target = Math.max(0, Math.min(index, images.length - 1));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gallery.scrollTo({ left: target * gallery.clientWidth, behavior: reducedMotion ? "instant" : "smooth" });
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!multiple || event.pointerType !== "mouse" || event.button !== 0) return;
    const gallery = event.currentTarget;
    drag.current = { id: event.pointerId, startX: event.clientX, startScroll: gallery.scrollLeft };
    gallery.dataset.dragging = "";
    gallery.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    event.currentTarget.scrollLeft = active.startScroll + active.startX - event.clientX;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    drag.current = null;
    const gallery = event.currentTarget;
    const distance = active.startX - event.clientX;
    const initial = Math.round(active.startScroll / gallery.clientWidth);
    const deliberateSwipe = event.type === "pointerup" && Math.abs(distance) >= Math.min(52, gallery.clientWidth * 0.16);
    const target = deliberateSwipe
      ? initial + Math.sign(distance)
      : Math.round(gallery.scrollLeft / gallery.clientWidth);
    delete gallery.dataset.dragging;
    goTo(target);
  }

  return (
    <section className="product-gallery" aria-label={`Фотографии товара «${name}»`}>
      {images.length === 0 ? (
        <div className="gallery-placeholder">
          <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" width={241} height={98} />
          <p>Фотография изделия готовится</p>
        </div>
      ) : (
        <div
          id={viewportId}
          ref={viewport}
          className={`product-gallery-viewport${multiple ? " product-gallery-viewport--swipe" : ""}`}
          tabIndex={multiple ? 0 : undefined}
          aria-label={multiple ? "Листайте фотографии жестом или клавишами влево и вправо" : undefined}
          onScroll={(event) => {
            const gallery = event.currentTarget;
            if (gallery.clientWidth) setCurrent(Math.round(gallery.scrollLeft / gallery.clientWidth));
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            goTo(current + (event.key === "ArrowLeft" ? -1 : 1));
          }}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
        >
          {images.map((source, index) => (
            <div className="gallery-image" key={`${index}-${source}`} aria-hidden={index !== current || undefined}>
              <Image
                src={source}
                alt={`${name}, фото ${index + 1} из ${images.length}`}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                priority={index === 0}
                draggable={false}
              />
            </div>
          ))}
        </div>
      )}
      {multiple && (
        <div className="gallery-pagination" role="group" aria-label="Выбор фотографии">
          {images.map((source, index) => (
            <button
              key={`${index}-${source}`}
              type="button"
              aria-label={`Фото ${index + 1} из ${images.length}`}
              aria-controls={viewportId}
              aria-current={current === index ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
          <span className="sr-only" aria-live="polite">Фото {current + 1} из {images.length}</span>
        </div>
      )}
    </section>
  );
}
