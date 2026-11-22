"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { siteContentFields, storefrontStorageKey, type SiteContentKey } from "@/lib/site-content";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const keys = ["hero", "home_intro", "about", "contacts"];
const SiteContentContext = createContext<Record<string, Record<string, unknown>> | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<Record<string, Record<string, unknown>> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;
    let active = true;
    let request = 0;

    async function refresh() {
      const current = ++request;
      const { data, error } = await client.from("site_content").select("key,content")
        .in("key", keys).eq("published", true);
      if (active && current === request && !error && data) {
        setBlocks(Object.fromEntries(data.map((row) => [row.key, row.content ?? {}])));
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key === storefrontStorageKey) void refresh();
    }

    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <SiteContentContext.Provider value={blocks}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent<K extends SiteContentKey>(key: K) {
  const blocks = useContext(SiteContentContext);
  return blocks === null || Object.hasOwn(blocks, key) ? siteContentFields(key, blocks?.[key]) : null;
}
