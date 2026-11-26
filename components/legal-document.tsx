"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DocumentState =
  | { kind: "loading" | "error" | "unpublished" }
  | { kind: "ready"; title: string; body: string };

export function LegalDocument({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const [state, setState] = useState<DocumentState>({ kind: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setState({ kind: "error" }); return; }
    let active = true;
    setState({ kind: "loading" });
    void supabase.from("legal_documents").select("title,body").eq("slug", slug).eq("published", true).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) setState({ kind: "error" });
      else if (data?.body?.trim()) setState({ kind: "ready", ...data });
      else setState({ kind: "unpublished" });
    });
    return () => { active = false; };
  }, [retry, slug]);

  return (
    <>
      <h1>{state.kind === "ready" ? state.title : fallbackTitle}</h1>
      <div className="legal-placeholder legal-body" aria-busy={state.kind === "loading"}>
        {state.kind === "ready" ? state.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
          : <p role="status">{state.kind === "loading" ? "Загружаем документ…" : state.kind === "error" ? "Не удалось загрузить документ." : "Документ пока не опубликован."}</p>}
        {state.kind === "error" && <button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>Повторить</button>}
      </div>
    </>
  );
}
