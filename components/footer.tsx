"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { assetPath } from "@/lib/asset-path";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function Footer() {
  const [contacts, setContacts] = useState({ phone: "89147771252", footer_text: "Украшения из дерева с берегов Амура" });
  useEffect(() => {
    const supabase = getSupabaseBrowserClient(); if (!supabase) return;
    void supabase.from("site_content").select("content").eq("key", "contacts").eq("published", true).maybeSingle().then(({ data }) => { if (data?.content) setContacts((current) => ({ ...current, ...(data.content as Partial<typeof current>) })); });
  }, []);
  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-mark" href="/" aria-label="JE TIKI — на главную">
          <Image src={assetPath("/je-tiki-logo-v2.svg")} alt="" width={241} height={98} />
        </Link>
        <p className="muted">{contacts.footer_text}</p>
      </div>
      <div className="footer-links" aria-label="Юридическая информация">
        <Link href="/legal/offer">Публичная оферта</Link>
        <Link href="/legal/privacy">Конфиденциальность</Link>
        <Link href="/legal/personal-data">Персональные данные</Link>
        <Link href="/legal/returns">Возврат и обмен</Link>
      </div>
      <div className="footer-contact">
        <a href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}>{contacts.phone}</a>
        <p>© {new Date().getFullYear()} JE TIKI</p>
      </div>
    </footer>
  );
}
