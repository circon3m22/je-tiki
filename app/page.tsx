import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl("/") },
};

export default HomePage;
