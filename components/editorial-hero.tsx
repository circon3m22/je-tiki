import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const qualities = [
  "Натуральное дерево",
  "Серебро 925",
  "Ручная работа",
  "Доставка по России",
] as const;

export function EditorialHero() {
  return (
    <section className="registry-hero">
      <div className="site-container registry-hero__shell">
        <div className="registry-hero__layout">
          <div className="registry-hero__copy">
            <p className="registry-label">Дерево и серебро</p>
            <h1>
              Одна форма.
              <span>Ни одного повтора.</span>
            </h1>
            <p className="registry-hero__intro">
              Дерево формирует неповторимый рисунок, серебро задаёт точность.
              Каждый объект сохраняет собственную комбинацию оттенка и волокон.
            </p>
            <div className="registry-hero__actions">
              <Link href="/catalog" className="button-primary">
                Открыть каталог
                <ArrowRight size={15} />
              </Link>
              <Link href="/materials" className="registry-text-link">
                Изучить материалы
              </Link>
            </div>
          </div>

          <figure className="registry-specimen">
            <div className="registry-specimen__image">
              <Image
                src="/images/product-ring-stone.webp"
                alt="Украшение из дерева и серебра"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
            <figcaption>
              Натуральный рисунок каждого изделия уникален
            </figcaption>
          </figure>
        </div>

        <ul
          className="registry-hero__qualities"
          aria-label="Особенности Je Tiki"
        >
          {qualities.map((quality) => (
            <li key={quality}>{quality}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
