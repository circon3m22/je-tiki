import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "О бренде",
  description:
    "Je Tiki — украшения и небольшие предметы из дерева и серебра, созданные вручную.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Je Tiki"
        title="Мы оставляем дереву право быть разным."
        intro="Je Tiki — мастерская в Хабаровске, где природный рисунок становится частью формы, а серебро задаёт точность."
        image="/images/editorial-jewelry-workshop.webp"
        imageAlt="Рабочее место в ювелирной мастерской"
      />
      <section className="section-space">
        <div className="site-container grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <p className="eyebrow text-stone-500">Подход</p>
          <div className="max-w-3xl">
            <p className="font-display text-3xl leading-[1.08] sm:text-5xl">
              Мы не заставляем два фрагмента дерева выглядеть одинаково. Форма
              задаёт направление, а волокна, оттенок и небольшие природные
              особенности оставляют за каждым изделием собственный характер.
            </p>
            <p className="mt-8 max-w-2xl text-base leading-8 text-stone-600">
              Каждая деталь проходит несколько этапов ручной обработки. Даже
              изделия одной модели немного отличаются друг от друга — так же,
              как не повторяется рисунок древесных волокон.
            </p>
          </div>
        </div>
      </section>
      <section className="site-container grid gap-4 pb-20 sm:grid-cols-2 sm:pb-28">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-200">
          <Image
            src="/images/editorial-craft-hands.webp"
            alt="Руки мастера обрабатывают небольшую деталь"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-200 sm:mt-24">
          <Image
            src="/images/editorial-wood-shavings.webp"
            alt="Древесная стружка после ручной обработки"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>
      <section className="border-y border-black/10 bg-[#f4f5f2] py-16 text-center sm:py-24">
        <div className="site-container">
          <h2 className="mx-auto max-w-3xl section-title">
            Откройте архив форм
          </h2>
          <Link href="/catalog" className="button-secondary mt-9">
            Смотреть коллекцию <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
