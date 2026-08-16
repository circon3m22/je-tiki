import { z } from "zod";

import { getDeliveryMethodLabel } from "@/lib/checkout/delivery";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { deliveryMethodSchema } from "@/lib/validation/checkout";

const paidOrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  customer_name: z.string(),
  customer_surname: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().email(),
  city: z.string(),
  postal_code: z.string().nullable(),
  address: z.string().nullable(),
  apartment: z.string().nullable(),
  delivery_method: deliveryMethodSchema,
  delivery_price: z.number().int().nonnegative(),
  subtotal: z.number().int().positive(),
  total: z.number().int().positive(),
  customer_comment: z.string().nullable(),
  payment_status: z.literal("paid"),
  notifications_sent_at: z.string().nullable(),
  order_items: z.array(
    z.object({
      product_name: z.string(),
      product_sku: z.string(),
      unit_price: z.number().int().positive(),
      quantity: z.number().int().positive(),
      line_total: z.number().int().positive(),
    }),
  ),
});

type PaidOrder = z.infer<typeof paidOrderSchema>;

interface NotificationTask {
  channel: "customer_email" | "owner_email" | "telegram";
  run: () => Promise<boolean>;
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function orderLines(order: PaidOrder): string {
  return order.order_items
    .map(
      (item) =>
        `• ${item.product_name} (${item.product_sku}) — ${item.quantity} × ${formatMoney(item.unit_price)} = ${formatMoney(item.line_total)}`,
    )
    .join("\n");
}

function customerEmailText(order: PaidOrder): string {
  return [
    `${order.customer_name}, спасибо за заказ в Je Tiki.`,
    "",
    `Заказ: ${order.order_number}`,
    "Оплата получена.",
    "",
    orderLines(order),
    "",
    `Способ доставки: ${getDeliveryMethodLabel(order.delivery_method)}`,
    `Доставка: ${formatMoney(order.delivery_price)}`,
    `Итого: ${formatMoney(order.total)}`,
    "",
    "Мы свяжемся с вами, когда заказ будет готов к отправке или выдаче.",
  ].join("\n");
}

function ownerNotificationText(order: PaidOrder): string {
  const address = [
    order.postal_code,
    order.city,
    order.address,
    order.apartment ? `кв./офис ${order.apartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `Оплачен заказ ${order.order_number}`,
    "",
    `Покупатель: ${order.customer_name} ${order.customer_surname}`,
    `Телефон: ${order.customer_phone}`,
    `Email: ${order.customer_email}`,
    `Доставка: ${getDeliveryMethodLabel(order.delivery_method)}`,
    `Адрес: ${address || "самовывоз"}`,
    "",
    orderLines(order),
    "",
    `Подытог: ${formatMoney(order.subtotal)}`,
    `Доставка: ${formatMoney(order.delivery_price)}`,
    `Итого: ${formatMoney(order.total)}`,
    order.customer_comment ? `Комментарий: ${order.customer_comment}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
        "User-Agent": "JeTiki/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const tokenIsValid = token && /^\d+:[A-Za-z0-9_-]{20,}$/.test(token);
  const chatIsValid =
    chatId && (/^-?\d+$/.test(chatId) || /^@[A-Za-z0-9_]+$/.test(chatId));

  if (!tokenIsValid || !chatIsValid) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096),
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return false;

    const payload = (await response.json()) as { ok?: unknown };
    return payload.ok === true;
  } catch {
    return false;
  }
}

/**
 * Claims and dispatches notifications once. Every provider error is contained;
 * payment confirmation must never be rolled back because a notification failed.
 */
async function dispatchPaidOrderNotifications(
  orderId: string,
): Promise<{ attempted: boolean; delivered: number; failed: number }> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,customer_name,customer_surname,customer_phone,customer_email,city,postal_code,address,apartment,delivery_method,delivery_price,subtotal,total,customer_comment,payment_status,notifications_sent_at,order_items(product_name,product_sku,unit_price,quantity,line_total)",
    )
    .eq("id", orderId)
    .maybeSingle();

  const parsed = paidOrderSchema.safeParse(data);
  if (error || !parsed.success || parsed.data.notifications_sent_at) {
    return { attempted: false, delivered: 0, failed: 0 };
  }

  const order = parsed.data;
  const tasks: NotificationTask[] = [];
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim();
  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
  );

  if (emailConfigured) {
    tasks.push({
      channel: "customer_email",
      run: () =>
        sendResendEmail({
          to: order.customer_email,
          subject: `Оплата заказа ${order.order_number} получена`,
          text: customerEmailText(order),
          idempotencyKey: `${order.id}-customer-email`,
        }),
    });

    if (ownerEmail) {
      tasks.push({
        channel: "owner_email",
        run: () =>
          sendResendEmail({
            to: ownerEmail,
            subject: `Оплачен заказ ${order.order_number}`,
            text: ownerNotificationText(order),
            idempotencyKey: `${order.id}-owner-email`,
          }),
      });
    }
  }

  if (telegramConfigured) {
    tasks.push({
      channel: "telegram",
      run: () => sendTelegramMessage(ownerNotificationText(order)),
    });
  }

  if (tasks.length === 0) {
    return { attempted: false, delivered: 0, failed: 0 };
  }

  const claimedAt = new Date().toISOString();
  const { data: claim, error: claimError } = await supabase
    .from("orders")
    .update({ notifications_sent_at: claimedAt })
    .eq("id", order.id)
    .eq("payment_status", "paid")
    .is("notifications_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError || !claim) {
    return { attempted: false, delivered: 0, failed: 0 };
  }

  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  const delivered = results.filter(
    (result) => result.status === "fulfilled" && result.value,
  ).length;

  return {
    attempted: true,
    delivered,
    failed: tasks.length - delivered,
  };
}

export async function sendPaidOrderNotificationsBestEffort(
  orderId: string,
): Promise<{ attempted: boolean; delivered: number; failed: number }> {
  try {
    return await dispatchPaidOrderNotifications(orderId);
  } catch {
    return { attempted: false, delivered: 0, failed: 0 };
  }
}
