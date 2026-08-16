"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MoveHorizontal } from "lucide-react";
import { useState } from "react";

export function MaterialReveal() {
  const [position, setPosition] = useState(54);

  return (
    <section className="material-dialogue">
      <div className="site-container material-dialogue__layout">
        <div className="material-dialogue__copy">
          <p className="registry-label">Материальный диалог</p>
          <h2>Тёплое дерево. Холодное серебро.</h2>
          <p className="material-dialogue__intro">
            Дерево задаёт неповторимый рисунок, серебро — точность и свет.
            Сдвиньте границу, чтобы рассмотреть контраст двух материалов.
          </p>
          <dl className="material-dialogue__facts">
            <div>
              <dt>Дерево</dt>
              <dd>Тон, направление волокон и тактильность</dd>
            </div>
            <div>
              <dt>Серебро</dt>
              <dd>Чистая линия, крепление и холодный акцент</dd>
            </div>
          </dl>
          <Link href="/materials" className="button-secondary">
            Исследовать материалы
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="material-reveal">
          <Image
            src="/images/editorial-wood-grain.webp"
            alt="Светлый рисунок натуральной древесины"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover"
          />
          <div
            className="material-reveal__silver"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            <Image
              src="/images/product-ring-stone.webp"
              alt="Серебряное украшение в направленном свете"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
          <span className="material-reveal__label material-reveal__label--wood">
            Дерево
          </span>
          <span className="material-reveal__label material-reveal__label--silver">
            Серебро
          </span>
          <input
            type="range"
            min="18"
            max="82"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="material-reveal__range"
            aria-label="Изменить границу между деревом и серебром"
            aria-valuetext={`Граница материалов: ${position}%`}
          />
          <span
            className="material-reveal__line"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
          <span
            className="material-reveal__handle"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          >
            <MoveHorizontal size={19} />
          </span>
        </div>
      </div>
    </section>
  );
}
