import { NextResponse } from "next/server";

import {
  CheckoutPersistenceError,
  getCheckoutPaymentStatus,
  PaymentVerificationError,
} from "@/lib/checkout/service";
import {
  isYooKassaConfigured,
  YooKassaApiError,
  YooKassaConfigurationError,
} from "@/lib/payments/yookassa";
import {
  isSupabaseServerConfigured,
  SupabaseServerConfigurationError,
} from "@/lib/supabase/server";

const ORDER_NUMBER_PATTERN = /^JT-\d{8}-[A-F0-9]{16}$/;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await context.params;
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) {
    return json({ ok: false, code: "order_not_found" }, 404);
  }

  if (!isSupabaseServerConfigured() || !isYooKassaConfigured()) {
    return json({ ok: false, code: "status_unavailable" }, 503);
  }

  try {
    const status = await getCheckoutPaymentStatus(orderNumber);
    if (!status) return json({ ok: false, code: "order_not_found" }, 404);
    return json({ ok: true, ...status }, 200);
  } catch (error) {
    if (
      error instanceof YooKassaApiError ||
      error instanceof YooKassaConfigurationError ||
      error instanceof SupabaseServerConfigurationError ||
      error instanceof CheckoutPersistenceError ||
      error instanceof PaymentVerificationError
    ) {
      return json({ ok: false, code: "status_unavailable" }, 503);
    }
    return json({ ok: false, code: "status_unavailable" }, 500);
  }
}
