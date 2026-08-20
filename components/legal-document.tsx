"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LegalDocument({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const [document, setDocument] = useState({ title: fallbackTitle, body: "Текст документа пока не опубликован." });
  useEffect(() => {
    const supabase = getSupabaseBrowserClient(); if (!supabase) return;
    void supabase.from("legal_documents").select("title,body").eq("slug", slug).eq("published", true).maybeSingle().then(({ data }) => { if (data) setDocument(data); });
  }, [slug]);
  return <><h1>{document.title}</h1><div className="legal-placeholder legal-body">{document.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></>;
}
