import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="success-page section-shell">
      <h1>Страница не найдена</h1>
      <p>Возможно, адрес изменился. Все доступные изделия собраны в каталоге.</p>
      <Link className="primary-button inline" href="/catalog/">Открыть каталог</Link>
    </main>
  );
}
