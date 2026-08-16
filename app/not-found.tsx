import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="site-container grid min-h-[72vh] items-center gap-10 py-16 lg:grid-cols-[0.4fr_1fr]">
      <p className="font-display text-[clamp(7rem,22vw,18rem)] leading-none text-[#354638]">
        404
      </p>
      <div>
        <p className="eyebrow text-stone-500">Страница не найдена</p>
        <h1 className="mt-5 font-display text-5xl leading-none sm:text-7xl">
          Эта линия оборвалась
        </h1>
        <p className="mt-6 max-w-lg text-sm leading-7 text-stone-600">
          Возможно, адрес изменился или изделия больше нет в коллекции.
          Вернитесь в каталог, чтобы продолжить выбор.
        </p>
        <Link href="/catalog" className="button-primary mt-9">
          Открыть каталог <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
