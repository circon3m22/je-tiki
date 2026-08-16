"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Je Tiki page error", error.digest ?? "unknown");
  }, [error.digest]);

  return (
    <div className="site-container flex min-h-[70vh] items-center justify-center py-20 text-center">
      <div className="max-w-xl">
        <p className="eyebrow text-stone-500">Временная ошибка</p>
        <h1 className="mt-5 font-display text-5xl sm:text-7xl">
          Не удалось открыть страницу
        </h1>
        <p className="mt-6 text-sm leading-7 text-stone-600">
          Попробуйте ещё раз. Если ошибка повторится, вернитесь в каталог
          немного позже.
        </p>
        <button type="button" className="button-primary mt-9" onClick={reset}>
          Повторить
        </button>
      </div>
    </div>
  );
}
