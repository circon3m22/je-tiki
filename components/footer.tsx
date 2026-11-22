"use client";

import Image from "next/image";
import Link from "next/link";
import { assetPath } from "@/lib/asset-path";
import { useSiteContent } from "@/components/site-content-provider";

export function Footer() {
  const contacts = useSiteContent("contacts");
  const about = useSiteContent("about");
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="footer-mark" href="/" aria-label="JE TIKI — на главную">
            <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" width={241} height={98} />
          </Link>
          {contacts?.footer_text && <p className="footer-description">{contacts.footer_text}</p>}
        </div>
        {contacts && <div className="footer-contact">
          <h2 className="footer-heading">Связаться с нами</h2>
          {contacts.phone && <a className="footer-phone" href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}>{contacts.phone}</a>}
          <p className="footer-location">Хабаровск, Дальний Восток</p>
        </div>}
        <nav className="footer-links" aria-label="Навигация по сайту">
          <h2 className="footer-heading">Мастерская</h2>
          <Link href="/catalog">Каталог</Link>
          {about && <Link href="/#about">О JE TIKI</Link>}
        </nav>
        <nav className="footer-links" aria-label="Юридическая информация">
          <h2 className="footer-heading">Покупателям</h2>
          <Link href="/legal/returns">Возврат и обмен</Link>
          <Link href="/legal/offer">Публичная оферта</Link>
          <Link href="/legal/privacy">Конфиденциальность</Link>
          <Link href="/legal/personal-data">Персональные данные</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <a className="footer-region-mark" href="https://sdelanovkhv.ru/">
          <Image src={assetPath("/made-in-khabarovsk-krai.svg")} alt="Сделано в Хабаровском крае" width={337} height={223} />
        </a>
        <p className="footer-copyright">© {new Date().getFullYear()} JE TIKI</p>
      </div>
    </footer>
  );
}
