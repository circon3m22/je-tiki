import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="site-container py-5">
      <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.13em] text-stone-500">
        <li>
          <Link href="/" className="hover:text-black">
            Главная
          </Link>
        </li>
        {items.map((item) => (
          <li
            key={`${item.href}-${item.label}`}
            className="flex items-center gap-2"
          >
            <span aria-hidden="true">/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-black">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-stone-800">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
