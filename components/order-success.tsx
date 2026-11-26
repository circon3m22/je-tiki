"use client";

import { useSearchParams } from "next/navigation";

export function OrderSuccess() {
  const searchParams = useSearchParams();
  const number = searchParams.get("number");

  if (!number || !/^JT-\d{8}$/.test(number)) {
    return <><h1>Статус заказа</h1><p>Здесь появится номер после оформления заказа.</p></>;
  }

  return (
    <>
      <h1>Заказ принят</h1>
      <p>Номер заказа <strong className="tabular">{number}</strong>.</p>
      <p>Мы свяжемся с вами, чтобы согласовать доставку.</p>
    </>
  );
}
