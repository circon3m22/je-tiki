import { NextResponse } from "next/server";

import {
  CheckoutPersistenceError,
  CheckoutStockError,
  PaymentVerificationError,
  startCheckout,
} from "@/lib/checkout/service";
import {
  YooKassaApiError,
  YooKassaConfigurationError,
  isYooKassaConfigured,
} from "@/lib/payments/yookassa";
import {
  SupabaseServerConfigurationError,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import {
  checkoutRequestSchema,
  idempotencyKeySchema,
} from "@/lib/validation/checkout";

const MAX_REQUEST_BYTES = 32 * 1024;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return json(
      { ok: false, code: "origin_not_allowed", message: "Запрос отклонён." },
      403,
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(
      {
        ok: false,
        code: "unsupported_media_type",
        message: "Некорректный формат запроса.",
      },
      415,
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json(
      {
        ok: false,
        code: "request_too_large",
        message: "Запрос слишком большой.",
      },
      413,
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return json(
      {
        ok: false,
        code: "request_too_large",
        message: "Запрос слишком большой.",
      },
      413,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(
      { ok: false, code: "invalid_json", message: "Некорректный запрос." },
      400,
    );
  }

  const parsed = checkoutRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        code: "validation_failed",
        message: "Проверьте заполненные поля.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }

  const headerKey = request.headers.get("idempotency-key")?.trim();
  if (
    headerKey &&
    parsed.data.idempotencyKey &&
    headerKey !== parsed.data.idempotencyKey
  ) {
    return json(
      {
        ok: false,
        code: "idempotency_key_mismatch",
        message: "Повторите оформление заказа.",
      },
      400,
    );
  }

  const idempotencyKey = headerKey || parsed.data.idempotencyKey;
  const parsedKey = idempotencyKeySchema.safeParse(idempotencyKey);
  if (!parsedKey.success) {
    return json(
      {
        ok: false,
        code: "idempotency_key_required",
        message: "Повторите оформление заказа.",
      },
      400,
    );
  }

  if (!isSupabaseServerConfigured() || !isYooKassaConfigured()) {
    return json(
      {
        ok: false,
        code: "checkout_not_configured",
        message:
          "Онлайн-оплата пока не настроена. Свяжитесь с Je Tiki для оформления заказа.",
      },
      503,
    );
  }

  try {
    const result = await startCheckout(parsed.data, parsedKey.data);
    return json({ ok: true, ...result }, 200);
  } catch (error) {
    if (error instanceof CheckoutStockError) {
      return json(
        {
          ok: false,
          code: "products_unavailable",
          message:
            "Некоторые изделия закончились или их осталось меньше, чем в корзине.",
        },
        409,
      );
    }

    if (
      error instanceof YooKassaConfigurationError ||
      error instanceof SupabaseServerConfigurationError
    ) {
      return json(
        {
          ok: false,
          code: "checkout_not_configured",
          message:
            "Онлайн-оплата пока не настроена. Свяжитесь с Je Tiki для оформления заказа.",
        },
        503,
      );
    }

    if (error instanceof YooKassaApiError) {
      return json(
        {
          ok: false,
          code: "payment_provider_unavailable",
          message: "Не удалось открыть оплату. Попробуйте ещё раз чуть позже.",
        },
        502,
      );
    }

    if (
      error instanceof CheckoutPersistenceError ||
      error instanceof PaymentVerificationError
    ) {
      return json(
        {
          ok: false,
          code: "checkout_temporarily_unavailable",
          message: "Не удалось оформить заказ. Попробуйте ещё раз чуть позже.",
        },
        503,
      );
    }

    return json(
      {
        ok: false,
        code: "checkout_failed",
        message: "Не удалось оформить заказ. Попробуйте ещё раз чуть позже.",
      },
      500,
    );
  }
}
