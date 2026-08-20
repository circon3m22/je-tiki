"use client";

import { useEffect } from "react";
import { assetPath } from "@/lib/asset-path";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register(assetPath("/sw.js"), {
      scope: assetPath("/"),
    }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
