import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal-document";

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
  const title = documents[document as DocumentSlug];
  return title ? { title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const title = documents[document as DocumentSlug];
  if (!title) notFound();
  return (
    <main id="main-content" className="legal-page section-shell">
      <p className="eyebrow">Юридическая информация</p>
      <LegalDocument slug={document} fallbackTitle={title} />
    </main>
  );
}
