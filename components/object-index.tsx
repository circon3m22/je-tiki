"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { categories } from "@/lib/catalog";

export function ObjectIndex() {
  const [activeSlug, setActiveSlug] = useState<string>(categories[0].slug);
  const active =
    categories.find((category) => category.slug === activeSlug) ??
    categories[0];

  return (
    <section className="object-index">
      <div className="site-container">
        <div className="registry-section-head">
          <div>
            <p className="registry-label">Категории</p>
            <h2>Выберите форму, которая останется с вами.</h2>
          </div>
          <Link href="/catalog" className="registry-text-link">
            Весь каталог
          </Link>
        </div>

        <div className="object-index__layout">
          <div className="object-index__list">
            {categories.map((category) => {
              const selected = category.slug === active.slug;

              return (
                <Link
                  href={`/catalog/${category.slug}`}
                  key={category.slug}
                  className="object-index__row"
                  data-active={selected ? "true" : "false"}
                  onMouseEnter={() => setActiveSlug(category.slug)}
                  onFocus={() => setActiveSlug(category.slug)}
                >
                  <strong>{category.name}</strong>
                  <span className="object-index__mobile-image">
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="84px"
                      className="object-cover"
                    />
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
              );
            })}
          </div>

          <figure className="object-index__preview">
            <div className="object-index__preview-image" key={active.slug}>
              <Image
                src={active.image}
                alt={active.imageAlt}
                fill
                sizes="(max-width: 1024px) 0px, 44vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
