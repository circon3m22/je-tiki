"use client";

import { type RefObject, useEffect } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.inert && element.getClientRects().length > 0,
  );
}

export function useModalFocus<T extends HTMLElement>({
  active,
  containerRef,
  onClose,
}: {
  active: boolean;
  containerRef: RefObject<T | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const previousActive = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const inerted: Array<{ element: HTMLElement; wasInert: boolean }> = [];

    let branch: HTMLElement = container;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
        inerted.push({ element: sibling, wasInert: sibling.inert });
        sibling.inert = true;
      }
      branch = parent;
      if (parent === document.body) break;
    }

    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      const initial = container.querySelector<HTMLElement>("[data-modal-initial-focus]")
        ?? focusableElements(container)[0]
        ?? container;
      initial.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      for (const { element, wasInert } of inerted.reverse()) element.inert = wasInert;
      if (previousActive?.isConnected && !previousActive.inert) {
        previousActive.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, onClose]);
}
