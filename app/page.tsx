import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/catalog";
import { EditorialHero } from "@/components/editorial-hero";
import { MaterialReveal } from "@/components/material-reveal";
import { ObjectIndex } from "@/components/object-index";
import { ProductCard } from "@/components/product-card";

const workshopSteps = [
  "Выбор древесины",
  "Формирование детали",
  "Обработка поверхности",
  "Соединение с серебром",
  "Проверка и упаковка",
] as const;

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      <EditorialHero />
      <ObjectIndex />

      <section className="registry-products">
        <div className="site-container">
          <div className="registry-section-head">
            <div>
              <h2>Коллекция без визуального шума.</h2>
            </div>
            <Link href="/catalog" className="registry-text-link">
              Смотреть все объекты
            </Link>
          </div>
          <div className="registry-products__grid">
            {featured.map((product, index) => (
              <div className="registry-product" key={product.id}>
                <ProductCard product={product} priority={index < 4} />
              </div>
            ))}
          </div>
          <Link
            href="/catalog"
            className="button-secondary registry-products__cta"
          >
            Открыть полный каталог
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <MaterialReveal />

      <section className="registry-process">
        <div className="site-container">
          <div className="registry-section-head">
            <div>
              <h2>Ручная работа. Ничего лишнего.</h2>
            </div>
            <p>
              Форма проходит последовательную ручную обработку — от выбора
              фрагмента до финальной проверки.
            </p>
          </div>
          <div className="registry-process__body">
            <figure className="registry-process__image">
              <Image
                src="/images/editorial-craft-hands.webp"
                alt="Ручная обработка небольшой детали"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </figure>
            <ul className="registry-process__steps">
              {workshopSteps.map((step) => (
                <li key={step}>
                  <strong>{step}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="registry-location">
        <div className="site-container registry-location__layout">
          <p className="registry-label">Сделано в Хабаровске</p>
          <h2>Сделано рядом с Амуром. Названо по тому, что рядом.</h2>
          <p>
            География остаётся в названиях и ритме коллекции — без буквального
            декора и лишних объяснений.
          </p>
          <div className="registry-location__names">
            {featured.slice(0, 3).map((product) => (
              <Link href={`/product/${product.slug}`} key={product.id}>
                <strong>{product.name}</strong>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="registry-gift">
        <div className="site-container registry-gift__layout">
          <figure>
            <div>
              <Image
                src="/images/editorial-gift-packaging.webp"
                alt="Минималистичная подарочная упаковка"
                fill
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="object-cover"
              />
            </div>
          </figure>
          <div className="registry-gift__copy">
            <h2>Объект уже готов стать подарком.</h2>
            <p>
              Фирменная коробка и рекомендации по уходу включены в каждый заказ.
            </p>
            <Link href="/catalog/gifts" className="button-secondary">
              Выбрать подарок
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="registry-close">
        <div className="site-container registry-close__layout">
          <h2>Найдите объект со своим рисунком.</h2>
          <Link href="/catalog" className="button-primary">
            Перейти в каталог
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
