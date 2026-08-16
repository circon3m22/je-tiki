import { z } from "zod";

export const DELIVERY_METHODS = [
  "pickup-khabarovsk",
  "cdek-pickup",
  "cdek-courier",
  "russian-post",
] as const;

export const deliveryMethodSchema = z.enum(DELIVERY_METHODS);
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;
export const idempotencyKeySchema = z.string().uuid();

const trimmedRequired = (label: string, maximum: number) =>
  z
    .string({ error: `${label}: укажите значение` })
    .trim()
    .min(1, `${label}: укажите значение`)
    .max(maximum, `${label}: слишком длинное значение`)
    .refine(
      (value) => !/[\u0000-\u001f\u007f]/.test(value),
      `${label}: содержит недопустимые символы`,
    );

const optionalTrimmed = (maximum: number) =>
  z.string().trim().max(maximum).optional().or(z.literal(""));

export const checkoutItemSchema = z
  .object({
    productId: z.string().uuid("Некорректный идентификатор товара"),
    quantity: z
      .number()
      .int("Количество должно быть целым числом")
      .min(1, "Минимальное количество — 1")
      .max(20, "Максимальное количество одного изделия — 20"),
  })
  .strict();

export const checkoutRequestSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema.optional(),
    customerName: trimmedRequired("Имя", 80),
    customerSurname: trimmedRequired("Фамилия", 80),
    customerPhone: z
      .string()
      .trim()
      .min(10, "Укажите телефон")
      .max(32, "Телефон слишком длинный")
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      }, "Проверьте номер телефона"),
    customerEmail: z
      .string()
      .trim()
      .email("Проверьте электронную почту")
      .max(254)
      .transform((value) => value.toLowerCase()),
    city: trimmedRequired("Город", 120),
    postalCode: optionalTrimmed(20),
    address: optionalTrimmed(250),
    apartment: optionalTrimmed(40),
    deliveryMethod: deliveryMethodSchema,
    customerComment: optionalTrimmed(1000),
    privacyAccepted: z
      .boolean()
      .refine((value) => value, "Нужно согласие с политикой обработки данных"),
    items: z
      .array(checkoutItemSchema)
      .min(1, "Корзина пуста")
      .max(50, "Слишком много позиций в корзине"),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    value.items.forEach((item, index) => {
      if (ids.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Одинаковые товары нужно объединить в одну позицию",
        });
      }
      ids.add(item.productId);
    });

    if (
      value.deliveryMethod !== "pickup-khabarovsk" &&
      !value.address?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Укажите адрес или пункт выдачи",
      });
    }

    if (
      value.deliveryMethod === "russian-post" &&
      !/^\d{6}$/.test(value.postalCode?.trim() ?? "")
    ) {
      context.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Для Почты России укажите индекс из 6 цифр",
      });
    }
  });

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

const moneySchema = z.object({
  value: z.string().regex(/^\d+(?:\.\d{2})$/),
  currency: z.literal("RUB"),
});

export const yookassaPaymentSchema = z
  .object({
    id: z.string().min(1).max(128),
    status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]),
    paid: z.boolean().optional(),
    amount: moneySchema,
    confirmation: z
      .object({
        type: z.string(),
        confirmation_url: z.string().url(),
      })
      .passthrough()
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .passthrough();

export const yookassaWebhookSchema = z
  .object({
    type: z.literal("notification"),
    event: z.enum([
      "payment.waiting_for_capture",
      "payment.succeeded",
      "payment.canceled",
    ]),
    object: yookassaPaymentSchema,
  })
  .passthrough();

export type YookassaPayment = z.infer<typeof yookassaPaymentSchema>;
export type YookassaWebhook = z.infer<typeof yookassaWebhookSchema>;
