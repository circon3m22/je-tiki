import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { CHECKOUT_DELIVERY_CONFIG } from "@/lib/checkout/delivery";
import { SITE_CONFIG } from "@/lib/config/site";
import { formatPrice } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Способы доставки, тарифы и оплата заказов Je Tiki.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <>
      <PageHero
        eyebrow="Покупателям"
        title="Доставка и оплата"
        intro={SITE_CONFIG.delivery.notice}
      />
      <section className="site-container grid gap-12 pb-20 sm:pb-28 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
        <div>
          <p className="eyebrow text-stone-500">Способы получения</p>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl">
            Выберите удобный вариант
          </h2>
        </div>
        <div className="border-t border-black/15">
          {Object.entries(CHECKOUT_DELIVERY_CONFIG.methods).map(
            ([id, method]) => (
              <article
                key={id}
                className="grid gap-3 border-b border-black/15 py-6 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <h3 className="font-display text-2xl">{method.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {id === "pickup-khabarovsk"
                      ? "Получение в Хабаровске по предварительному согласованию времени."
                      : "Срок зависит от региона и выбранного пункта или адреса получения."}
                  </p>
                </div>
                <p className="text-sm">
                  {method.price === 0
                    ? "Бесплатно"
                    : `от ${formatPrice(method.price)}`}
                </p>
              </article>
            ),
          )}
          <p className="mt-6 text-sm leading-7 text-stone-600">
            Для заказов от{" "}
            {formatPrice(CHECKOUT_DELIVERY_CONFIG.freeDeliveryFrom)} доставка
            бесплатна, кроме случаев, отдельно согласованных с покупателем.
          </p>
        </div>
      </section>
      <section className="bg-[#e8e1d5] py-16 sm:py-24">
        <div className="site-container grid gap-10 sm:grid-cols-3">
          <article>
            <p className="eyebrow text-stone-500">Оплата</p>
            <h2 className="mt-4 font-display text-3xl">Онлайн через ЮKassa</h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              После серверной проверки цен и наличия откроется защищённая
              страница оплаты. Заказ подтверждается только после ответа
              платёжной системы.
            </p>
          </article>
          <article>
            <p className="eyebrow text-stone-500">Срок</p>
            <h2 className="mt-4 font-display text-3xl">Зависит от региона</h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Предварительная информация показывается при оформлении. Мы не
              обещаем срок, который не можем гарантировать перевозчиком.
            </p>
          </article>
          <article>
            <p className="eyebrow text-stone-500">Упаковка</p>
            <h2 className="mt-4 font-display text-3xl">Включена в заказ</h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Изделия отправляются в подарочной коробке с рекомендациями по
              уходу и дополнительной транспортной защитой.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
