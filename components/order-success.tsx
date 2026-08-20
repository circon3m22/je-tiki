"use client";

import { useSearchParams } from "next/navigation";

export function OrderSuccess() {
  const searchParams = useSearchParams();
  const number = searchParams.get("number");

  return (
    <>
      <p>
        {number ? (
          <>Номер заказа: <strong className="tabular">{number}</strong>.</>
        ) : (
          "Номер заказа отправлен на вашу электронную почту."
        )}
      </p>
      <p>Мы получили заказ и скоро свяжемся с вами, чтобы согласовать удобный пункт выдачи.</p>
    </>
  );
}
