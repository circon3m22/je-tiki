import { getProductImages } from "@/lib/catalog/images";
import { SITE_CONFIG } from "@/lib/config/site";
import type {
  LocalProductSlug,
  Product,
  ProductCategory,
} from "@/lib/types/catalog";

export const JEWELRY_CARE = [
  "Избегайте длительного контакта с водой и не храните изделие во влажном помещении.",
  "Снимайте украшение перед душем, бассейном и занятиями спортом.",
  "Не наносите парфюм и косметические средства непосредственно на изделие.",
  "Протирайте дерево мягкой сухой тканью, а серебро — специальной салфеткой.",
  "Храните изделие отдельно от других украшений.",
] as const;

export const ACCESSORY_CARE = [
  "Избегайте длительного контакта с водой и сильного перегрева.",
  "Не используйте абразивные средства и бытовую химию.",
  "Протирайте поверхность мягкой сухой тканью.",
  "Не оставляйте изделие надолго во влажном помещении.",
] as const;

export const GIFT_CARE = [
  "Берегите изделие от длительного контакта с водой и прямого нагрева.",
  "Удаляйте пыль мягкой сухой тканью без чистящих средств.",
  "Серебряные элементы очищайте подходящей ювелирной салфеткой.",
  "Храните предмет в сухом месте.",
] as const;

type LocalProductInput = Omit<
  Product,
  "slug" | "images" | "oldPrice" | "wildberriesUrl" | "care"
> & {
  slug: LocalProductSlug;
  oldPrice?: number | null;
  wildberriesUrl?: string | null;
  care?: readonly string[];
};

function defineProduct(input: LocalProductInput): Product {
  const defaultCare =
    input.category === "keychains"
      ? ACCESSORY_CARE
      : input.category === "gifts"
        ? GIFT_CARE
        : JEWELRY_CARE;

  return {
    ...input,
    oldPrice: input.oldPrice ?? null,
    wildberriesUrl:
      input.wildberriesUrl ??
      SITE_CONFIG.wildberries.productUrls[input.slug] ??
      null,
    care: input.care ?? defaultCare,
    images: getProductImages(input.slug, input.name),
  };
}

export const localProducts = [
  defineProduct({
    id: "10000000-0000-4000-8000-000000000001",
    name: "Серьги «Тихая бухта»",
    slug: "tikhaya-bukhta",
    category: "earrings",
    price: 3_900,
    shortDescription: "Лёгкие серьги из тёплой ольхи с серебряным контуром.",
    description:
      "Плавная форма напоминает линию закрытой морской бухты. Тонкая серебряная рамка подчёркивает естественный рисунок ольхи, а ручная шлифовка оставляет поверхность матовой и приятной на ощупь.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Ольха",
    metal: "Серебро 925 пробы",
    dimensions: "32 × 14 × 4 мм",
    weight: 5,
    fastening: "Английский замок",
    sku: "JT-ER-001",
    isAvailable: true,
    stock: 7,
    productionTime: "3–5 рабочих дней",
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-02-14T03:00:00.000Z",
    updatedAt: "2026-07-08T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000002",
    name: "Серьги «Северный ветер»",
    slug: "severny-veter",
    category: "earrings",
    price: 4_600,
    shortDescription:
      "Удлинённые серьги из ореха и серебра с подвижной деталью.",
    description:
      "Строгий вытянутый силуэт оживает при движении благодаря серебряному шарниру. Тёмный орех делает пару графичной, но сохраняет мягкость природного материала.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Орех",
    metal: "Серебро 925 пробы",
    dimensions: "48 × 11 × 4 мм",
    weight: 7,
    fastening: "Серебряная швенза с фиксатором",
    sku: "JT-ER-002",
    isAvailable: true,
    stock: 4,
    productionTime: "4–6 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-01-29T03:00:00.000Z",
    updatedAt: "2026-06-21T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000003",
    name: "Серьги «Свет над Амуром»",
    slug: "svet-nad-amurom",
    category: "earrings",
    price: 4_300,
    shortDescription: "Светлый клён и матовое серебро в мягкой округлой форме.",
    description:
      "Полукруги из клёна собраны так, чтобы рисунок древесины продолжался от одной детали к другой. Сатинированное серебро отражает свет спокойно, без избыточного блеска.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Клён",
    metal: "Серебро 925 пробы",
    dimensions: "28 × 18 × 4 мм",
    weight: 6,
    fastening: "Пусета с серебряным фиксатором",
    sku: "JT-ER-003",
    isAvailable: true,
    stock: 9,
    productionTime: "3–5 рабочих дней",
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    createdAt: "2026-07-12T03:00:00.000Z",
    updatedAt: "2026-07-12T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000004",
    name: "Серьги «Кедровая линия»",
    slug: "kedrovaya-liniya",
    category: "earrings",
    price: 3_500,
    shortDescription: "Тонкие серьги из кедра с лаконичной серебряной швензой.",
    description:
      "Узкая деревянная пластина подчёркивает продольное направление кедровых волокон. Небольшой вес делает эту модель удобной на весь день, а тёплый оттенок легко сочетается с базовыми цветами.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Кедр",
    metal: "Серебро 925 пробы",
    dimensions: "42 × 8 × 3 мм",
    weight: 4,
    fastening: "Серебряная швенза с фиксатором",
    sku: "JT-ER-004",
    isAvailable: true,
    stock: 12,
    productionTime: "3–5 рабочих дней",
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    createdAt: "2025-11-18T03:00:00.000Z",
    updatedAt: "2026-07-02T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000005",
    name: "Подвеска «Исток»",
    slug: "istok",
    category: "pendants",
    price: 5_900,
    shortDescription:
      "Подвеска из ореха с тонкой серебряной линией и цепочкой.",
    description:
      "В центре тёмной деревянной формы проходит серебряная линия, похожая на начало водного потока. Подвеска отполирована вручную и дополнена регулируемой серебряной цепочкой.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Орех",
    metal: "Серебро 925 пробы",
    dimensions: "38 × 22 × 6 мм, цепочка 45–50 см",
    weight: 12,
    fastening: "Карабин",
    sku: "JT-PD-001",
    isAvailable: true,
    stock: 6,
    productionTime: "5–7 рабочих дней",
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    createdAt: "2025-12-03T03:00:00.000Z",
    updatedAt: "2026-07-10T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000006",
    name: "Подвеска «Туман над морем»",
    slug: "tuman-nad-morem",
    category: "pendants",
    price: 4_800,
    shortDescription:
      "Светлая подвеска из клёна с серебряной вставкой мягкой формы.",
    description:
      "Матовый клён и прохладное серебро сходятся в асимметричном силуэте с размытыми границами. Лёгкая подвеска лежит близко к телу и подходит для многослойных сочетаний.",
    materials: ["Натуральное дерево", "Серебро 925 пробы", "Текстильный шнур"],
    woodType: "Клён",
    metal: "Серебро 925 пробы",
    dimensions: "34 × 25 × 5 мм, шнур 50 см",
    weight: 10,
    fastening: "Регулируемый серебряный замок",
    sku: "JT-PD-002",
    isAvailable: true,
    stock: 8,
    productionTime: "4–6 рабочих дней",
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    createdAt: "2026-07-05T03:00:00.000Z",
    updatedAt: "2026-07-11T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000007",
    name: "Подвеска «Течение»",
    slug: "techenie",
    category: "pendants",
    price: 6_200,
    shortDescription: "Дубовая подвеска с объёмным серебряным элементом.",
    description:
      "Рельефная серебряная деталь проходит по поверхности дуба свободной непрерывной линией. Выразительная текстура материала делает каждую подвеску немного иной, сохраняя общий спокойный силуэт.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Дуб",
    metal: "Серебро 925 пробы",
    dimensions: "46 × 20 × 7 мм, цепочка 55 см",
    weight: 16,
    fastening: "Карабин",
    sku: "JT-PD-003",
    isAvailable: true,
    stock: 3,
    productionTime: "6–8 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-03-19T03:00:00.000Z",
    updatedAt: "2026-06-30T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000008",
    name: "Браслет «Каменный берег»",
    slug: "kamenny-bereg",
    category: "bracelets",
    price: 5_700,
    shortDescription: "Браслет из тёмного ореха с гладкой серебряной вставкой.",
    description:
      "Небольшие округлые звенья из ореха чередуются с прохладной серебряной деталью, напоминающей обточенный водой камень. Посадка регулируется удлинительной цепочкой.",
    materials: ["Натуральное дерево", "Серебро 925 пробы", "Ювелирный трос"],
    woodType: "Орех",
    metal: "Серебро 925 пробы",
    dimensions: "Обхват 16–19 см, ширина 10 мм",
    weight: 18,
    fastening: "Карабин с удлинительной цепочкой",
    sku: "JT-BR-001",
    isAvailable: true,
    stock: 5,
    productionTime: "5–7 рабочих дней",
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-01-11T03:00:00.000Z",
    updatedAt: "2026-06-26T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000009",
    name: "Браслет «Таёжная тропа»",
    slug: "taezhnaya-tropa",
    category: "bracelets",
    price: 4_200,
    shortDescription:
      "Гибкий браслет из кедровых элементов с серебряным акцентом.",
    description:
      "Кедровые детали различной длины складываются в спокойный ритм, похожий на неровную лесную тропу. Центральная бусина из серебра добавляет прохладный акцент и удерживает композицию.",
    materials: [
      "Натуральное дерево",
      "Серебро 925 пробы",
      "Эластичная ювелирная нить",
    ],
    woodType: "Кедр",
    metal: "Серебро 925 пробы",
    dimensions: "Обхват 16–18 см, ширина 8 мм",
    weight: 14,
    fastening: "Без застёжки, эластичная основа",
    sku: "JT-BR-002",
    isAvailable: true,
    stock: 11,
    productionTime: "4–6 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: true,
    createdAt: "2025-10-24T03:00:00.000Z",
    updatedAt: "2026-07-06T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000010",
    name: "Браслет «Полдень»",
    slug: "polden",
    category: "bracelets",
    price: 3_900,
    shortDescription: "Светлый браслет из клёна с тонким серебряным замком.",
    description:
      "Мягко скруглённые кленовые сегменты сохраняют светлый естественный оттенок древесины. Миниатюрный серебряный замок почти не нарушает цельную линию браслета.",
    materials: ["Натуральное дерево", "Серебро 925 пробы", "Ювелирный трос"],
    woodType: "Клён",
    metal: "Серебро 925 пробы",
    dimensions: "Обхват 17–19 см, ширина 7 мм",
    weight: 13,
    fastening: "Серебряный карабин",
    sku: "JT-BR-003",
    isAvailable: true,
    stock: 7,
    productionTime: "4–6 рабочих дней",
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    createdAt: "2026-06-28T03:00:00.000Z",
    updatedAt: "2026-07-09T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000011",
    name: "Брелок «Маяк»",
    slug: "mayak",
    category: "keychains",
    price: 2_100,
    shortDescription: "Дубовый брелок строгой геометрии со стальным кольцом.",
    description:
      "Вертикальная форма и небольшая металлическая насечка напоминают световой пояс маяка. Плотный дуб хорошо переносит ежедневное использование, постепенно приобретая индивидуальную патину.",
    materials: ["Натуральное дерево", "Нержавеющая сталь"],
    woodType: "Дуб",
    metal: "Нержавеющая сталь",
    dimensions: "62 × 18 × 8 мм",
    weight: 22,
    fastening: "Разъёмное стальное кольцо 30 мм",
    sku: "JT-KC-001",
    isAvailable: true,
    stock: 14,
    productionTime: "3–5 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-02-01T03:00:00.000Z",
    updatedAt: "2026-06-12T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000012",
    name: "Брелок «След тайги»",
    slug: "sled-taygi",
    category: "keychains",
    price: 1_800,
    shortDescription: "Компактный кедровый брелок с рельефной линией волокон.",
    description:
      "Поверхность брелока обработана так, чтобы тактильно ощущался продольный рисунок кедра. Простая форма не цепляется за карман, а стальное кольцо рассчитано на повседневную нагрузку.",
    materials: ["Натуральное дерево", "Нержавеющая сталь"],
    woodType: "Кедр",
    metal: "Нержавеющая сталь",
    dimensions: "48 × 24 × 7 мм",
    weight: 16,
    fastening: "Разъёмное стальное кольцо 25 мм",
    sku: "JT-KC-002",
    isAvailable: true,
    stock: 18,
    productionTime: "2–4 рабочих дня",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2025-12-14T03:00:00.000Z",
    updatedAt: "2026-06-18T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000013",
    name: "Брелок «Речной камень»",
    slug: "rechnoy-kamen",
    category: "keychains",
    price: 2_400,
    shortDescription: "Округлый брелок из ореха с серебристой вставкой.",
    description:
      "Асимметричная деревянная форма отшлифована до гладкости речной гальки. Небольшая вставка из матовой стали защищает отверстие крепления и поддерживает лаконичный характер предмета.",
    materials: ["Натуральное дерево", "Нержавеющая сталь"],
    woodType: "Орех",
    metal: "Нержавеющая сталь",
    dimensions: "52 × 31 × 9 мм",
    weight: 24,
    fastening: "Стальное кольцо с короткой цепочкой",
    sku: "JT-KC-003",
    isAvailable: true,
    stock: 6,
    productionTime: "3–5 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-04-07T03:00:00.000Z",
    updatedAt: "2026-06-29T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000014",
    name: "Настольный объект «Горизонт»",
    slug: "gorizont",
    category: "gifts",
    price: 6_800,
    shortDescription:
      "Небольшой настольный объект из ясеня с серебряной линией.",
    description:
      "Светлая цельная форма из ясеня разделена тонкой горизонтальной вставкой из серебра. Объект можно использовать как держатель для колец или оставить самостоятельным акцентом на рабочем столе.",
    materials: ["Натуральное дерево", "Серебро 925 пробы"],
    woodType: "Ясень",
    metal: "Серебро 925 пробы",
    dimensions: "90 × 42 × 28 мм",
    weight: 95,
    fastening: null,
    sku: "JT-GF-001",
    isAvailable: true,
    stock: 0,
    productionTime: "7–10 рабочих дней",
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-03-02T03:00:00.000Z",
    updatedAt: "2026-06-22T03:00:00.000Z",
  }),
  defineProduct({
    id: "10000000-0000-4000-8000-000000000015",
    name: "Подарочный набор «Тёплый берег»",
    slug: "teply-bereg",
    category: "gifts",
    price: 7_400,
    oldPrice: 8_200,
    shortDescription:
      "Подвеска и небольшой брелок из ореха в подарочной коробке.",
    description:
      "Два предмета из одной заготовки ореха объединены общим рисунком древесины: лаконичная подвеска с серебряной деталью и компактный брелок. Цена набора ниже стоимости изделий по отдельности; упаковка и карточка по уходу уже включены.",
    materials: ["Натуральное дерево", "Серебро 925 пробы", "Нержавеющая сталь"],
    woodType: "Орех",
    metal: "Серебро 925 пробы и нержавеющая сталь",
    dimensions: "Подвеска 36 × 20 мм, брелок 48 × 22 мм",
    weight: 38,
    fastening: "Карабин и разъёмное кольцо",
    sku: "JT-GF-002",
    isAvailable: true,
    stock: 0,
    productionTime: "6–9 рабочих дней",
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    createdAt: "2026-05-20T03:00:00.000Z",
    updatedAt: "2026-07-03T03:00:00.000Z",
  }),
] as const satisfies readonly Product[];

export const products = localProducts;

export const catalogMaterials = Array.from(
  new Set(localProducts.flatMap((product) => product.materials)),
).sort((left, right) => left.localeCompare(right, "ru"));

export const localProductCounts = localProducts.reduce(
  (counts, product) => {
    counts[product.category] += 1;
    return counts;
  },
  {
    earrings: 0,
    pendants: 0,
    bracelets: 0,
    keychains: 0,
    gifts: 0,
  } satisfies Record<ProductCategory, number>,
);

export function getCareRecommendations(
  category: ProductCategory,
): readonly string[] {
  if (category === "keychains") return ACCESSORY_CARE;
  if (category === "gifts") return GIFT_CARE;
  return JEWELRY_CARE;
}

export function isProductSlug(value: string): value is LocalProductSlug {
  return localProducts.some((product) => product.slug === value);
}
