import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { getConfiguredContactLinks, SITE_CONFIG } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Связаться с Je Tiki по вопросам изделий, заказов и сотрудничества.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  const links = getConfiguredContactLinks();
  return (
    <>
      <PageHero
        eyebrow="Je Tiki"
        title="Будем на связи"
        intro="Напишите нам о выборе изделия, заказе или сотрудничестве. Мы внимательно прочитаем сообщение и ответим в рабочее время."
      />
      <section className="site-container grid gap-14 pb-20 sm:pb-28 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
        <div className="border-t border-black/15 pt-6">
          <h2 className="font-display text-3xl">Контакты</h2>
          {links.length > 0 ? (
            <ul className="mt-7 space-y-4">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http") ? "noreferrer" : undefined
                    }
                    className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
                  >
                    {link.label}
                    {link.href.startsWith("http") ? (
                      <ArrowUpRight size={14} />
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {SITE_CONFIG.contacts.workingHours ? (
            <div className="mt-8">
              <p className="eyebrow text-stone-500">Режим работы</p>
              <p className="mt-3 text-sm">
                {SITE_CONFIG.contacts.workingHours}
              </p>
            </div>
          ) : null}
          <p className="mt-8 max-w-sm text-sm leading-7 text-stone-600">
            Je Tiki работает в Хабаровске. Самовывоз возможен после
            подтверждения заказа и согласования времени.
          </p>
        </div>
        <div className="bg-[#e8e1d5] p-6 sm:p-10">
          <p className="eyebrow mb-4 text-stone-500">Форма обратной связи</p>
          <h2 className="mb-8 font-display text-4xl">Расскажите, чем помочь</h2>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
