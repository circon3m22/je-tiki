import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  text: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Проверьте имя, почту и текст сообщения." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !recipient || !from) {
    return NextResponse.json(
      {
        message: "Форма временно недоступна. Попробуйте ещё раз позже.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: parsed.data.email,
        subject: `Сообщение с сайта Je Tiki от ${parsed.data.name}`,
        text: parsed.data.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("delivery failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Не удалось отправить сообщение. Попробуйте ещё раз позже." },
      { status: 502 },
    );
  }
}
