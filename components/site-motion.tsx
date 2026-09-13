"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Content stays visible without JavaScript or motion support. */
export function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracked = new Set<HTMLElement>();
    const show = (element: HTMLElement) => {
      element.dataset.revealState = "visible";
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) show(entry.target as HTMLElement); });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    const scan = () => {
      for (const element of tracked) {
        if (!element.isConnected) { observer.unobserve(element); tracked.delete(element); }
      }
      main.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
        if (tracked.has(element)) return;
        tracked.add(element);
        const rect = element.getBoundingClientRect();
        if (preference.matches || rect.top < window.innerHeight) show(element);
        else {
          element.dataset.revealState = "pending";
          observer.observe(element);
        }
      });
    };
    const revealAll = () => { if (preference.matches) tracked.forEach(show); };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let element = event.target.closest<HTMLElement>("[data-reveal]");
      while (element) { show(element); element = element.parentElement?.closest<HTMLElement>("[data-reveal]") ?? null; }
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(main, { childList: true, subtree: true });
    preference.addEventListener("change", revealAll);
    main.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", revealAll);
      main.removeEventListener("focusin", focus);
      tracked.forEach((element) => { delete element.dataset.revealState; });
    };
  }, [pathname]);
  return null;
}
