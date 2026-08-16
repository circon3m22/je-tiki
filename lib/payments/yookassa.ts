import {
  yookassaPaymentSchema,
  type YookassaPayment,
} from "@/lib/validation/checkout";

const YOOKASSA_API_URL = "https://api.yookassa.ru/v3/";

export class YooKassaConfigurationError extends Error {
  constructor() {
    super("YooKassa credentials are not configured.");
    this.name = "YooKassaConfigurationError";
  }
}

export class YooKassaApiError extends Error {
  constructor(public readonly status: number) {
    super("YooKassa API request failed.");
    this.name = "YooKassaApiError";
  }
}

interface YooKassaConfig {
  shopId: string;
  secretKey: string;
  returnUrl: string;
}

interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  total: number;
  idempotencyKey: string;
}

function readConfig(): YooKassaConfig {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  const returnUrl = process.env.YOOKASSA_RETURN_URL?.trim();

  if (!shopId || !secretKey || !returnUrl) {
    throw new YooKassaConfigurationError();
  }

  let parsedReturnUrl: URL;
  try {
    parsedReturnUrl = new URL(returnUrl);
  } catch {
    throw new YooKassaConfigurationError();
  }
  const isLocalHttp =
    parsedReturnUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsedReturnUrl.hostname);

  if (parsedReturnUrl.protocol !== "https:" && !isLocalHttp) {
    throw new YooKassaConfigurationError();
  }

  return { shopId, secretKey, returnUrl: parsedReturnUrl.toString() };
}

export function isYooKassaConfigured(): boolean {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}

export function formatYooKassaAmount(rubles: number): string {
  if (!Number.isSafeInteger(rubles) || rubles <= 0) {
    throw new RangeError("Invalid payment amount.");
  }
  return `${rubles}.00`;
}

async function yookassaRequest(
  path: string,
  init: RequestInit,
): Promise<YookassaPayment> {
  const { shopId, secretKey } = readConfig();
  const authorization = `Basic ${btoa(`${shopId}:${secretKey}`)}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", authorization);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(new URL(path, YOOKASSA_API_URL), {
      ...init,
      headers,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
  } catch {
    throw new YooKassaApiError(503);
  }

  if (!response.ok) throw new YooKassaApiError(response.status);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new YooKassaApiError(502);
  }

  const parsed = yookassaPaymentSchema.safeParse(payload);
  if (!parsed.success) throw new YooKassaApiError(502);
  return parsed.data;
}

export async function createYooKassaPayment(
  input: CreatePaymentInput,
): Promise<YookassaPayment> {
  const { returnUrl } = readConfig();
  const paymentReturnUrl = new URL(returnUrl);
  paymentReturnUrl.searchParams.set("order", input.orderNumber);

  return yookassaRequest("payments", {
    method: "POST",
    headers: { "Idempotence-Key": input.idempotencyKey },
    body: JSON.stringify({
      amount: {
        value: formatYooKassaAmount(input.total),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: paymentReturnUrl.toString(),
      },
      description: `Заказ ${input.orderNumber}`.slice(0, 128),
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
      },
    }),
  });
}

export async function getYooKassaPayment(
  paymentId: string,
): Promise<YookassaPayment> {
  if (!/^[a-zA-Z0-9-]{1,128}$/.test(paymentId)) {
    throw new YooKassaApiError(400);
  }

  return yookassaRequest(`payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  });
}
