import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Материалы и производство",
  description:
    "Натуральное дерево, серебряные элементы и ручная обработка изделий Je Tiki.",
  alternates: { canonical: "/materials" },
};

const principles = [
  [
    "Природный рисунок",
    "Направление волокон, оттенок и небольшие естественные особенности делают каждую деталь неповторимой.",
  ],
  [
    "Точная форма",
    "Ручная обработка помогает сохранить тактильность дерева и добиться чистого, современного силуэта.",
  ],
  [
    "Холодный акцент",
    "Серебряные элементы добавляют контраст, функциональность и соединяют природный материал с ювелирной точностью.",
  ],
] as const;

export default function MaterialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Материалы"
        title="Дерево решает, каким будет финал."
        intro="Оттенок и направление волокон невозможно повторить по шаблону — именно поэтому материал становится соавтором каждого изделия."
        image="/images/editorial-wood-grain.webp"
        imageAlt="Естественный рисунок древесных волокон, крупный план"
      />
      <section className="section-space">
        <div className="site-container grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
          <div>
            <p className="eyebrow text-stone-500">Материал и форма</p>
            <h2 className="mt-5 font-display text-4xl sm:text-6xl">
              Не два одинаковых фрагмента
            </h2>
          </div>
          <div className="space-y-6 text-base leading-8 text-stone-600">
            <p>
              Дерево — натуральный материал, поэтому его оттенок, плотность и
              направление волокон могут отличаться даже внутри одной породы. Мы
              рассматриваем эти различия не как недостаток, а как часть
              характера будущего изделия.
            </p>
            <p>
              Порода дерева выбирается отдельно для каждой модели и указывается
              в карточке товара. Серебряные детали подбираются с учётом формы,
              веса и способа крепления.
            </p>
            <p>
              Поверхность формируется, шлифуется и проверяется вручную. Мы
              стремимся расходовать материал бережно, но не делаем
              неподтверждённых заявлений о его происхождении или экологическом
              следе.
            </p>
          </div>
        </div>
      </section>
      <section className="site-container grid gap-3 pb-16 sm:grid-cols-3 sm:pb-24">
        {[
          "/images/editorial-wood-carving.webp",
          "/images/product-ring-stone.webp",
          "/images/editorial-wood-shavings.webp",
        ].map((src, index) => (
          <div
            key={src}
            className={`relative aspect-[3/4] overflow-hidden bg-stone-200 ${index === 1 ? "sm:mt-16" : ""}`}
          >
            <Image
              src={src}
              alt={
                [
                  "Ручная обработка детали из древесины",
                  "Серебряная деталь крупным планом",
                  "Древесная стружка после обработки",
                ][index]
              }
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </section>
      <section className="bg-[#e8e1d5] py-16 sm:py-24">
        <div className="site-container grid gap-10 sm:grid-cols-3">
          {principles.map(([title, text]) => (
            <article key={title} className="border-t border-black/20 pt-5">
              <h2 className="font-display text-3xl">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
