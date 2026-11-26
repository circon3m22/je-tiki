import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { assetPath } from "@/lib/asset-path";

export const metadata: Metadata = {
  title: "Управление магазином",
  robots: { index: false, follow: false },
  manifest: assetPath("/manifest.webmanifest"),
  appleWebApp: { capable: true, statusBarStyle: "default", title: "JE TIKI" },
};

export default function AdminPage() {
  return <><PwaRegistrar /><AdminPanel /></>;
}
