import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { sendWebPush } from "../_shared/web-push.ts";

type CheckoutPayload = {
  customer_name?: unknown;
  customer_phone?: unknown;
  customer_email?: unknown;
  shipping_city?: unknown;
  shipping_address?: unknown;
  shipping_method?: unknown;
  comment?: unknown;
  offer_accepted?: unknown;
  personal_data_consent?: unknown;
};

function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= maxLength ? result : null;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    let payload: CheckoutPayload;
    try {
      payload = await req.json() as CheckoutPayload;
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const customerName = requiredText(payload.customer_name, 120);
    const customerPhone = requiredText(payload.customer_phone, 40);
    const customerEmail = requiredText(payload.customer_email, 254);
    const shippingCity = requiredText(payload.shipping_city, 160);
    const shippingAddress = requiredText(payload.shipping_address, 500);
    const shippingMethod = payload.shipping_method;
    const comment = typeof payload.comment === "string"
      ? payload.comment.trim().slice(0, 1000) || null
      : null;
    const userId = ctx.userClaims?.id;

    if (
      !userId || !customerName || !customerPhone || !customerEmail ||
      !shippingCity || !shippingAddress ||
      !/^\S+@\S+\.\S+$/.test(customerEmail) ||
      (shippingMethod !== "cdek" && shippingMethod !== "post") ||
      payload.offer_accepted !== true ||
      payload.personal_data_consent !== true
    ) {
      return Response.json({ error: "invalid_checkout" }, { status: 422 });
    }

    const { data, error } = await ctx.supabaseAdmin.rpc("create_order", {
      p_user_id: userId,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_email: customerEmail,
      p_shipping_city: shippingCity,
      p_shipping_address: shippingAddress,
      p_shipping_method: shippingMethod,
      p_comment: comment,
    });

    if (error || !data?.[0]) {
      console.error("create_order failed", error?.code ?? "empty_result");
      const errorCode = error?.message?.includes("legal_documents_unavailable")
        ? "legal_documents_unavailable"
        : error?.message?.includes("empty_cart")
          ? "empty_cart"
          : error?.message?.includes("stock_changed")
            ? "stock_changed"
            : "order_not_created";
      return Response.json({ error: errorCode }, { status: 409 });
    }

    const notificationTask = (async () => { try {
      const { data: subscriptions, error: subscriptionsError } = await ctx.supabaseAdmin
        .from("admin_push_subscriptions")
        .select("id,endpoint,p256dh,auth");
      if (subscriptionsError) throw subscriptionsError;
      const order = data[0];
      await sendWebPush(ctx.supabaseAdmin, subscriptions ?? [], {
        title: `Новый заказ ${order.order_number}`,
        body: `${customerName} · ${new Intl.NumberFormat("ru-RU").format(order.total)} ₽`,
        url: "admin/",
        tag: `je-tiki-order-${order.order_id}`,
      });
    } catch (notificationError) {
      console.error("Admin notification failed", notificationError);
    } })();
    EdgeRuntime.waitUntil(notificationTask);

    return Response.json({
      order_id: data[0].order_id,
      order_number: data[0].order_number,
      total: data[0].total,
      payment_status: "pending",
    });
  }),
};
