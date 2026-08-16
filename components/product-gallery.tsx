"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useState } from "react";
import type { ProductImage } from "@/lib/types/catalog";

export function ProductGallery({
  images,
  name,
}: {
  images: readonly ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  function go(direction: -1 | 1) {
    setActive(
      (current) => (current + direction + images.length) % images.length,
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[82px_1fr]">
        <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              onClick={() => setActive(index)}
              className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden border ${index === active ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}
              aria-label={`Показать изображение ${index + 1}: ${image.alt}`}
              aria-pressed={index === active}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <div
          className="relative order-1 aspect-[4/5] touch-pan-y overflow-hidden bg-[#e7e1d5] lg:order-2"
          onTouchStart={(event) =>
            setTouchStart(event.changedTouches[0].clientX)
          }
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const delta = event.changedTouches[0].clientX - touchStart;
            if (Math.abs(delta) > 45) go(delta > 0 ? -1 : 1);
            setTouchStart(null);
          }}
        >
          <Image
            src={images[active].src}
            alt={images[active].alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 54vw"
            className="object-cover"
          />
          <button
            type="button"
            className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center bg-[#f3efe6]/90"
            onClick={() => setZoomed(true)}
            aria-label={`Увеличить изображение: ${name}`}
          >
            <Maximize2 size={17} strokeWidth={1.4} />
          </button>
          {images.length > 1 ? (
            <div className="absolute inset-x-4 bottom-4 flex justify-between lg:hidden">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center bg-[#f3efe6]/90"
                onClick={() => go(-1)}
                aria-label="Предыдущее изображение"
              >
                <ChevronLeft size={19} />
              </button>
              <span className="flex items-center bg-[#f3efe6]/90 px-3 text-[10px] tracking-[0.15em]">
                {active + 1} / {images.length}
              </span>
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center bg-[#f3efe6]/90"
                onClick={() => go(1)}
                aria-label="Следующее изображение"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {zoomed ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#121410]/95 p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={`Увеличенное изображение ${name}`}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex min-h-12 min-w-12 items-center justify-center text-white sm:right-8 sm:top-8"
            onClick={() => setZoomed(false)}
            aria-label="Закрыть увеличенное изображение"
          >
            <X size={27} strokeWidth={1.3} />
          </button>
          <div className="relative h-full w-full max-w-6xl">
            <Image
              src={images[active].src}
              alt={images[active].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center text-white sm:left-8"
                onClick={() => go(-1)}
                aria-label="Предыдущее изображение"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center text-white sm:right-8"
                onClick={() => go(1)}
                aria-label="Следующее изображение"
              >
                <ChevronRight size={28} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
