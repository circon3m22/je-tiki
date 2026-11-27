"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { assetPath } from "@/lib/asset-path";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const viewport = useRef<HTMLDivElement>(null);
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
          aria-label={multiple ? "Галерея фотографий" : undefined}
          onScroll={(event) => {
            const gallery = event.currentTarget;
            if (gallery.clientWidth) setCurrent(Math.max(0, Math.min(images.length - 1, Math.round(gallery.scrollLeft / gallery.clientWidth))));
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            goTo(current + (event.key === "ArrowLeft" ? -1 : 1));
          }}
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
        <>
          <button className="gallery-step gallery-step--previous" type="button"
            aria-label="Предыдущее фото" aria-controls={viewportId}
            disabled={current === 0} onClick={() => goTo(current - 1)}>
            <ArrowIcon className="icon" />
          </button>
          <button className="gallery-step gallery-step--next" type="button"
            aria-label="Следующее фото" aria-controls={viewportId}
            disabled={current === images.length - 1} onClick={() => goTo(current + 1)}>
            <ArrowIcon className="icon" />
          </button>
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
          </div>
          <span className="sr-only" aria-live="polite">Фото {current + 1} из {images.length}</span>
        </>
      )}
    </section>
  );
}
