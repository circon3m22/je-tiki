import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal-document";

import { siteUrl } from "@/lib/site-url";

const documents = {
  offer: "Публичная оферта",
  privacy: "Политика конфиденциальности",
  "personal-data": "Согласие на обработку персональных данных",
  returns: "Возврат и обмен",
} as const;

type DocumentSlug = keyof typeof documents;

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> {
  const { document } = await params;
  const title = Object.hasOwn(documents, document) ? documents[document as DocumentSlug] : undefined;
  return title ? { title, alternates: { canonical: siteUrl(`/legal/${document}/`) } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const title = Object.hasOwn(documents, document) ? documents[document as DocumentSlug] : undefined;
  if (!title) notFound();
  return (
    <main id="main-content" className="legal-page section-shell">
      <LegalDocument slug={document} fallbackTitle={title} />
    </main>
  );
}
