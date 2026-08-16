import { NextResponse } from "next/server";

import {
  CheckoutPersistenceError,
  PaymentVerificationError,
  reconcileVerifiedYooKassaPayment,
} from "@/lib/checkout/service";
import {
  getYooKassaPayment,
  isYooKassaConfigured,
  YooKassaApiError,
  YooKassaConfigurationError,
} from "@/lib/payments/yookassa";
import {
  isSupabaseServerConfigured,
  SupabaseServerConfigurationError,
} from "@/lib/supabase/server";
import { yookassaWebhookSchema } from "@/lib/validation/checkout";

const MAX_WEBHOOK_BYTES = 128 * 1024;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false }, 415);
  }

  if (!isSupabaseServerConfigured() || !isYooKassaConfigured()) {
    return json({ ok: false }, 503);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return json({ ok: false }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return json({ ok: false }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false }, 400);
  }

  const notification = yookassaWebhookSchema.safeParse(payload);
  if (!notification.success) return json({ ok: false }, 400);

  try {
    // YooKassa notifications are not signed. Authenticate the event by fetching
    // the current payment directly from the provider with server credentials.
    const verifiedPayment = await getYooKassaPayment(
      notification.data.object.id,
    );
    await reconcileVerifiedYooKassaPayment(verifiedPayment);

    // YooKassa expects HTTP 200 as acknowledgement and ignores the body.
    return json({ ok: true }, 200);
  } catch (error) {
    if (
      error instanceof YooKassaConfigurationError ||
      error instanceof SupabaseServerConfigurationError ||
      error instanceof YooKassaApiError ||
      error instanceof CheckoutPersistenceError
    ) {
      // A non-2xx response asks YooKassa to retry delivery later.
      return json({ ok: false }, 503);
    }

    if (error instanceof PaymentVerificationError) {
      return json({ ok: false }, 409);
    }

    return json({ ok: false }, 500);
  }
}
