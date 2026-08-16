import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <>
      <Breadcrumbs items={[{ label: title }]} />
      <header className="registry-page-hero">
        <div className="site-container">
          <div
            className={`registry-page-hero__layout ${image ? "registry-page-hero__layout--media" : ""}`}
          >
            <div className="registry-page-hero__copy">
              <p className="registry-label">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>
            {image ? (
              <figure className="registry-page-hero__media">
                <div>
                  <Image
                    src={image}
                    alt={imageAlt ?? ""}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 38vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
