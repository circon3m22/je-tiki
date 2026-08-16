import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Уход за изделиями",
  description:
    "Рекомендации по уходу за украшениями Je Tiki из дерева и серебра.",
  alternates: { canonical: "/care" },
};

const careSteps = [
  "Избегайте длительного контакта с водой и не храните изделие во влажном помещении.",
  "Снимайте украшение перед бассейном и душем.",
  "Не наносите парфюм непосредственно на изделие.",
  "Протирайте дерево мягкой сухой тканью.",
  "Храните изделие отдельно от других украшений.",
  "Серебряные элементы очищайте подходящей ювелирной салфеткой.",
] as const;

export default function CarePage() {
  return (
    <>
      <PageHero
        eyebrow="Уход"
        title="Простые бережные привычки"
        intro="Дерево и серебро сохраняют выразительность дольше, если защищать их от влаги, косметики и механического контакта."
      />
      <section className="site-container grid gap-12 pb-20 sm:pb-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-200">
          <Image
            src="/images/product-earrings-worn.webp"
            alt="Лаконичные серьги на человеке"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        <ol className="border-t border-black/15 lg:self-center">
          {careSteps.map((step, index) => (
            <li
              key={step}
              className="grid grid-cols-[44px_1fr] gap-3 border-b border-black/15 py-5"
            >
              <span className="text-[10px] tracking-[0.15em] text-stone-500">
                0{index + 1}
              </span>
              <p className="text-sm leading-7">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
