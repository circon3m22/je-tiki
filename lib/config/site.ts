export interface DeliveryMethodConfig {
  id: "cdek-pickup" | "cdek-courier" | "russian-post";
  name: string;
  description: string;
  basePrice: number | null;
  enabled: boolean;
}

export interface SellerConfig {
  legalName: string | null;
  legalForm: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  bankName: string | null;
  bankAccount: string | null;
  correspondentAccount: string | null;
  bik: string | null;
}

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const SITE_CONFIG = {
  brand: {
    name: "Je Tiki",
    tagline: "Природный материал в современной форме",
    description:
      "Je Tiki создаёт украшения и небольшие предметы из дерева и серебра, сохраняя природный рисунок материала.",
    locale: "ru-RU",
    currency: "RUB",
    country: "RU",
  },
  contacts: {
    phone: null,
    email: null,
    workingHours: null,
    feedbackEmail: null,
  },
  social: {
    instagram: null,
    telegram: null,
  },
  seller: {
    legalName: null,
    legalForm: null,
    inn: null,
    ogrn: null,
    legalAddress: null,
    bankName: null,
    bankAccount: null,
    correspondentAccount: null,
    bik: null,
  } satisfies SellerConfig,
  delivery: {
    notice:
      "Срок и стоимость доставки зависят от региона и выбранного способа. Итоговая информация отображается при оформлении заказа.",
    freeFrom: 8_000,
    methods: [
      {
        id: "cdek-pickup",
        name: "СДЭК до пункта выдачи",
        description: "Срок и тариф рассчитываются по выбранному пункту выдачи.",
        basePrice: null,
        enabled: true,
      },
      {
        id: "cdek-courier",
        name: "Курьерская доставка СДЭК",
        description: "Срок и тариф рассчитываются по адресу получателя.",
        basePrice: null,
        enabled: true,
      },
      {
        id: "russian-post",
        name: "Почта России",
        description:
          "Срок и тариф зависят от региона и параметров отправления.",
        basePrice: null,
        enabled: true,
      },
    ] satisfies readonly DeliveryMethodConfig[],
  },
  packaging: {
    included: true,
    description:
      "Каждое изделие бережно упаковано в лаконичную подарочную коробку.",
  },
  wildberries: {
    enabled: false,
    storefrontUrl: null,
    sellerName: "Je Tiki",
    productUrls: {
      "tikhaya-bukhta": null,
      "severny-veter": null,
      "svet-nad-amurom": null,
      "kedrovaya-liniya": null,
      istok: null,
      "tuman-nad-morem": null,
      techenie: null,
      "kamenny-bereg": null,
      "taezhnaya-tropa": null,
      polden: null,
      mayak: null,
      "sled-taygi": null,
      "rechnoy-kamen": null,
      gorizont: null,
      "teply-bereg": null,
    },
  },
  seo: {
    siteUrl: configuredSiteUrl,
    title: "Je Tiki — украшения из дерева и серебра",
    titleTemplate: "%s — Je Tiki",
    description:
      "Современные серьги, подвески, браслеты и сувениры из натурального дерева и серебра. Ручная работа, природный рисунок и лаконичные формы.",
    defaultOgImage: "/og.png",
    twitterCard: "summary_large_image" as const,
  },
  payments: {
    provider: "yookassa" as const,
    enabled: false,
    currency: "RUB",
    returnPath: "/order/success",
  },
  emailNotifications: {
    enabled: false,
    fromEmail: null,
    sellerRecipient: null,
    customerConfirmation: true,
  },
  naturalMaterialNotice:
    "Природный рисунок каждого изделия уникален. Оттенок и расположение древесных волокон могут немного отличаться от фотографии.",
} as const;

export const siteConfig = SITE_CONFIG;

export function getConfiguredContactLinks() {
  const links = [
    SITE_CONFIG.contacts.phone
      ? {
          id: "phone",
          label: SITE_CONFIG.contacts.phone,
          href: `tel:${SITE_CONFIG.contacts.phone}`,
        }
      : null,
    SITE_CONFIG.contacts.email
      ? {
          id: "email",
          label: SITE_CONFIG.contacts.email,
          href: `mailto:${SITE_CONFIG.contacts.email}`,
        }
      : null,
    SITE_CONFIG.social.instagram
      ? {
          id: "instagram",
          label: "Instagram",
          href: SITE_CONFIG.social.instagram,
        }
      : null,
    SITE_CONFIG.social.telegram
      ? { id: "telegram", label: "Telegram", href: SITE_CONFIG.social.telegram }
      : null,
    SITE_CONFIG.wildberries.storefrontUrl
      ? {
          id: "wildberries",
          label: "Wildberries",
          href: SITE_CONFIG.wildberries.storefrontUrl,
        }
      : null,
  ];

  return links.filter(
    (link): link is NonNullable<typeof link> => link !== null,
  );
}
