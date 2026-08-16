"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("sending");
    setMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          text: form.get("text"),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.message ?? "Не удалось отправить сообщение.");
        return;
      }
      setStatus("sent");
      setMessage(
        "Спасибо. Мы получили сообщение и ответим на указанную почту.",
      );
      formElement.reset();
    } catch {
      setStatus("error");
      setMessage("Не удалось связаться с сервером. Попробуйте ещё раз позже.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <label className="block">
        <span className="field-label">Имя</span>
        <input
          name="name"
          className="field-input"
          required
          maxLength={80}
          autoComplete="name"
        />
      </label>
      <label className="block">
        <span className="field-label">Электронная почта</span>
        <input
          name="email"
          type="email"
          className="field-input"
          required
          maxLength={254}
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="field-label">Сообщение</span>
        <textarea
          name="text"
          className="field-textarea"
          required
          maxLength={2000}
        />
      </label>
      {message ? (
        <p
          role="status"
          className={`text-xs leading-5 ${status === "error" ? "text-[#8d2f26]" : "text-[#536650]"}`}
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        className="button-primary"
        disabled={status === "sending" || status === "sent"}
      >
        {status === "sending" ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Send size={15} />
        )}
        {status === "sending"
          ? "Отправляем…"
          : status === "sent"
            ? "Сообщение отправлено"
            : "Отправить"}
      </button>
    </form>
  );
}
