import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getConfiguredContactLinks, SITE_CONFIG } from "@/lib/config/site";

const footerGroups = [
  {
    title: "Коллекция",
    links: [
      ["Все изделия", "/catalog"],
      ["Серьги", "/catalog/earrings"],
      ["Подвески", "/catalog/pendants"],
      ["Браслеты", "/catalog/bracelets"],
      ["Подарки", "/catalog/gifts"],
    ],
  },
  {
    title: "Информация",
    links: [
      ["О бренде", "/about"],
      ["Материалы", "/materials"],
      ["Доставка и оплата", "/delivery"],
      ["Уход", "/care"],
      ["Контакты", "/contacts"],
    ],
  },
  {
    title: "Документы",
    links: [
      ["Публичная оферта", "/offer"],
      ["Конфиденциальность", "/privacy"],
      ["Возврат и обмен", "/returns"],
    ],
  },
] as const;

export function SiteFooter() {
  const contactLinks = getConfiguredContactLinks();

  return (
    <footer className="site-footer">
      <div className="site-container py-14 sm:py-20">
        <div className="grid gap-14 border-b border-black/10 pb-14 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <Link
              href="/"
              aria-label="Je Tiki — главная"
              className="inline-flex"
            >
              <BrandLogo tone="dark" className="w-[158px]" />
            </Link>
            <p className="mt-7 max-w-sm font-display text-3xl leading-[1.05] sm:text-4xl">
              Природный материал в современной форме.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#727874]">
              Украшения и небольшие предметы из дерева и серебра, созданные
              вручную.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-[#727874]">
                  {group.title}
                </p>
                <ul className="space-y-3 text-sm">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="transition hover:text-[#727874]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs text-[#727874] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.brand.name}. Все права
            защищены.
          </p>
          {contactLinks.length > 0 ? (
            <div className="flex flex-wrap gap-5">
              {contactLinks.map((link) => (
                <a
                  href={link.href}
                  key={link.id}
                  className="inline-flex items-center gap-1.5 transition hover:text-[#111412]"
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {link.label}
                  {link.href.startsWith("http") ? (
                    <ArrowUpRight size={12} />
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
