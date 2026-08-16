import { z } from "zod";

import { getDeliveryPricing } from "@/lib/checkout/delivery";
import { sendPaidOrderNotificationsBestEffort } from "@/lib/notifications/order-notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  createYooKassaPayment,
  formatYooKassaAmount,
  getYooKassaPayment,
  YooKassaApiError,
} from "@/lib/payments/yookassa";
import type {
  CheckoutRequest,
  YookassaPayment,
} from "@/lib/validation/checkout";

const checkoutOrderSchema = z.object({
  order_id: z.string().uuid(),
  order_number: z.string().min(1),
  subtotal: z.number().int().positive(),
  delivery_price: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  external_payment_id: z.string().nullable(),
});

const storedOrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  total: z.number().int().positive(),
  payment_status: z.string(),
  order_status: z.string(),
  payment_provider: z.literal("yookassa"),
  external_payment_id: z.string().nullable(),
});

type CheckoutOrder = z.infer<typeof checkoutOrderSchema>;

export class CheckoutPersistenceError extends Error {
  constructor() {
    super("Unable to persist checkout.");
    this.name = "CheckoutPersistenceError";
  }
}

export class CheckoutStockError extends Error {
  constructor() {
    super("One or more products are unavailable.");
    this.name = "CheckoutStockError";
  }
}

export class PaymentVerificationError extends Error {
  constructor() {
    super("Payment does not match its order.");
    this.name = "PaymentVerificationError";
  }
}

function createOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 16)
    .toUpperCase();
  return `JT-${date}-${suffix}`;
}

function emptyToNull(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function createPendingOrder(
  request: CheckoutRequest,
  idempotencyKey: string,
): Promise<CheckoutOrder> {
  const supabase = getSupabaseAdminClient();
  const pricing = getDeliveryPricing(request.deliveryMethod);
  const { data, error } = await supabase.rpc("create_checkout_order", {
    p_payload: {
      checkout_idempotency_key: idempotencyKey,
      order_number: createOrderNumber(),
      customer_name: request.customerName,
      customer_surname: request.customerSurname,
      customer_phone: request.customerPhone,
      customer_email: request.customerEmail,
      city: request.city,
      postal_code: emptyToNull(request.postalCode),
      address: emptyToNull(request.address),
      apartment: emptyToNull(request.apartment),
      delivery_method: request.deliveryMethod,
      delivery_base_price: pricing.basePrice,
      free_delivery_from: pricing.freeDeliveryFrom,
      customer_comment: emptyToNull(request.customerComment),
      items: request.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    },
  });

  if (error) {
    if (error.message.includes("cart_contains_unavailable_products")) {
      throw new CheckoutStockError();
    }
    throw new CheckoutPersistenceError();
  }

  const row = Array.isArray(data) ? data[0] : data;
  const parsed = checkoutOrderSchema.safeParse(row);
  if (!parsed.success) throw new CheckoutPersistenceError();
  return parsed.data;
}

async function storeExternalPaymentId(
  orderId: string,
  paymentId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ external_payment_id: paymentId })
    .eq("id", orderId)
    .is("external_payment_id", null)
    .select("external_payment_id")
    .maybeSingle();

  if (error) throw new CheckoutPersistenceError();
  if (data?.external_payment_id === paymentId) return;

  const { data: existing, error: readError } = await supabase
    .from("orders")
    .select("external_payment_id")
    .eq("id", orderId)
    .maybeSingle();

  if (readError || existing?.external_payment_id !== paymentId) {
    throw new CheckoutPersistenceError();
  }
}

/**
 * Applies only a payment freshly retrieved from the authenticated YooKassa API.
 * Webhook payload fields alone are never trusted to change an order status.
 */
export async function reconcileVerifiedYooKassaPayment(
  payment: YookassaPayment,
): Promise<{ orderNumber: string; paymentStatus: string }> {
  const metadataOrderId = payment.metadata.order_id;
  if (typeof metadataOrderId !== "string") {
    throw new PaymentVerificationError();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,total,payment_status,order_status,payment_provider,external_payment_id",
    )
    .eq("id", metadataOrderId)
    .maybeSingle();

  const parsed = storedOrderSchema.safeParse(data);
  if (error || !parsed.success) throw new PaymentVerificationError();

  const order = parsed.data;
  const metadataOrderNumber = payment.metadata.order_number;
  const matches =
    metadataOrderNumber === order.order_number &&
    payment.amount.currency === "RUB" &&
    payment.amount.value === formatYooKassaAmount(order.total) &&
    (order.external_payment_id === null ||
      order.external_payment_id === payment.id);

  if (!matches) throw new PaymentVerificationError();

  if (payment.status === "succeeded" && payment.paid === true) {
    if (order.payment_status === "refunded") {
      return { orderNumber: order.order_number, paymentStatus: "refunded" };
    }
    if (order.payment_status === "paid") {
      await sendPaidOrderNotificationsBestEffort(order.id);
      return { orderNumber: order.order_number, paymentStatus: "paid" };
    }

    const { data: transitioned, error: updateError } = await supabase
      .from("orders")
      .update({
        external_payment_id: payment.id,
        payment_status: "paid",
        order_status: "confirmed",
      })
      .eq("id", order.id)
      .neq("payment_status", "paid")
      .neq("payment_status", "refunded")
      .select("id")
      .maybeSingle();

    if (updateError) throw new CheckoutPersistenceError();
    if (transitioned) {
      await sendPaidOrderNotificationsBestEffort(order.id);
    }
    return { orderNumber: order.order_number, paymentStatus: "paid" };
  }

  if (payment.status === "canceled") {
    if (order.payment_status !== "pending_payment") {
      return {
        orderNumber: order.order_number,
        paymentStatus: order.payment_status,
      };
    }

    const { error: updateError } = await supabase.rpc("cancel_checkout_order", {
      p_order_id: order.id,
      p_payment_id: payment.id,
    });

    if (updateError) throw new CheckoutPersistenceError();
    return { orderNumber: order.order_number, paymentStatus: "canceled" };
  }

  return {
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
  };
}

export async function startCheckout(
  request: CheckoutRequest,
  idempotencyKey: string,
) {
  const order = await createPendingOrder(request, idempotencyKey);

  const payment = order.external_payment_id
    ? await getYooKassaPayment(order.external_payment_id)
    : await createYooKassaPayment({
        orderId: order.order_id,
        orderNumber: order.order_number,
        total: order.total,
        idempotencyKey,
      });

  if (payment.status === "pending" && !payment.confirmation?.confirmation_url) {
    throw new YooKassaApiError(502);
  }

  await storeExternalPaymentId(order.order_id, payment.id);
  const reconciliation = await reconcileVerifiedYooKassaPayment(payment);

  return {
    orderNumber: order.order_number,
    subtotal: order.subtotal,
    deliveryPrice: order.delivery_price,
    total: order.total,
    paymentStatus: reconciliation.paymentStatus,
    confirmationUrl: payment.confirmation?.confirmation_url ?? null,
  };
}

export async function getCheckoutPaymentStatus(orderNumber: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,total,payment_status,order_status,payment_provider,external_payment_id",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  const parsed = storedOrderSchema.safeParse(data);
  if (error || !parsed.success) return null;

  if (!parsed.data.external_payment_id) {
    return {
      orderNumber: parsed.data.order_number,
      paymentStatus: parsed.data.payment_status,
    };
  }

  const payment = await getYooKassaPayment(parsed.data.external_payment_id);
  return reconcileVerifiedYooKassaPayment(payment);
}
