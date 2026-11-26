"use client";

import { type RefObject, useEffect } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]",
].join(",");

type Modal = { container: HTMLElement; previousFocus: HTMLElement | null };
const modals: Modal[] = [];
const inerted: HTMLElement[] = [];
let previousOverflow = "";

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => (element.tabIndex >= 0 || element.tagName === "SUMMARY") &&
      !element.closest("[inert]") && element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility === "visible",
  );
}

function syncInert() {
  inerted.splice(0).forEach((element) => { element.inert = false; });
  let branch = modals.at(-1)?.container;
  while (branch?.parentElement) {
    const parent: HTMLElement = branch.parentElement;
    for (const sibling of parent.children) {
      if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      sibling.inert = true;
      inerted.push(sibling);
    }
    if (parent === document.body) break;
    branch = parent;
  }
}

function focusInitial(container: HTMLElement) {
  const initial = container.querySelector<HTMLElement>("[data-modal-initial-focus]")
    ?? focusableElements(container)[0]
    ?? container;
  initial.focus({ preventScroll: true });
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
    const container = containerRef.current;
    if (!active || !container) return;
    const modal = {
      container,
      previousFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    if (!modals.length) previousOverflow = document.body.style.overflow;
    modals.push(modal);
    document.body.style.overflow = "hidden";
    syncInert();
    const frame = window.requestAnimationFrame(() => {
      if (modals.at(-1) === modal) focusInitial(container);
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (modals.at(-1) !== modal) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements(modal.container);
      const first = focusable[0];
      const last = focusable.at(-1);
      const current = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        modal.container.focus({ preventScroll: true });
      } else if (!focusable.some((element) => element === current) || current === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
      const wasTop = modals.at(-1) === modal;
      modals.splice(modals.indexOf(modal), 1);
      syncInert();
      if (modals.length === 0) document.body.style.overflow = previousOverflow;
      if (!wasTop) return;
      const previous = modal.previousFocus;
      if (previous?.isConnected && !previous.closest("[inert]")) {
        previous.focus({ preventScroll: true });
      } else {
        const next = modals.at(-1)?.container;
        if (next) focusInitial(next);
      }
    };
  }, [active, containerRef, onClose]);
}
