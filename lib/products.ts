import type { Category, Product } from "@/lib/types";
import { assetPath } from "@/lib/asset-path";

const images = {
  spiralPack: assetPath("/images/je-tiki/spiral-packaging.jpeg"),
  spiralModel: assetPath("/images/je-tiki/spiral-on-model.jpg"),
  guardians: assetPath("/images/je-tiki/seven-guardians.jpg"),
  triangleCard: assetPath("/images/je-tiki/triangle-card.jpg"),
  triangleStuds: assetPath("/images/je-tiki/triangle-studs.jpg"),
  triangleModel: assetPath("/images/je-tiki/triangle-on-model.jpg"),
  triangleModelNew: assetPath("/images/je-tiki/triangle-on-model.webp"),
  triangleWhiteBox: assetPath("/images/je-tiki/triangle-white-box.webp"),
  triangleCardNew: assetPath("/images/je-tiki/triangle-card-new.webp"),
  broochBirdModel: assetPath("/images/je-tiki/brooch-bird-on-model.webp"),
  broochBirdProduct: assetPath("/images/je-tiki/brooch-bird-product.webp"),
  broochBirdCard: assetPath("/images/je-tiki/brooch-bird-card.webp"),
};

const woodMaterial = "Массив натурального дерева, стальная фурнитура";
const woodType = "Японский вяз из Хабаровского края";
const sharedCare =
  "Берегите дерево от воды, парфюма и прямого солнца. Храните отдельно и протирайте сухой мягкой тканью.";

const amurIntro =
  "Величественная река, таёжный свободный дух и благородная красота бескрайних земель задают особый ритм. Традиционные знаки Приамурья получают современную форму в натуральном дереве.";
const guardiansIntro =
  "Сэвэны — символические помощники и проводники в мир духов, божеств и стихий. Образы коллекции вдохновлены культовой скульптурой народов Приамурья и собранием Хабаровского краевого музея имени Н. И. Гродекова.";
const pathIntro =
  "Коллекция «На Пути» раскрывает природный рисунок дерева через простые геометрические знаки. Каждое изделие шлифуется вручную и сохраняет уникальный оттенок массива.";

type CatalogProductInput = {
  slug: string;
  name: string;
  subtitle: string;
  category: Category;
  collection: string;
  description: string;
  variants?: string[];
  dimensions?: string;
  material?: string;
  wood?: string;
  metal?: string;
  price?: number;
  images?: string[];
};

function catalogProduct(input: CatalogProductInput): Product {
  return {
    slug: input.slug,
    name: input.name,
    subtitle: input.subtitle,
    category: input.category,
    collection: input.collection,
    price: input.price ?? 1000,
    orderable: false,
    image: input.images?.[0] ?? null,
    images: input.images ?? [],
    material: input.material ?? woodMaterial,
    woodType: input.wood ?? woodType,
    metal: input.metal ?? "Сталь",
    dimensions: input.dimensions ?? "Размер уточняется",
    stock: 0,
    description: input.description,
    care: sharedCare,
    variants: input.variants,
  };
}

const availableProducts: Product[] = [
  {
    slug: "earrings-spiral",
    name: "Спирали",
    subtitle: "Серьги · японский вяз",
    category: "Серьги",
    collection: "В ритме Амура · Этника",
    price: 3600,
    orderable: true,
    image: images.spiralModel,
    images: [images.spiralModel, images.spiralPack],
    material: woodMaterial,
    woodType,
    metal: "Сталь",
    dimensions: "Размер уточняется",
    stock: 3,
    description:
      "Спираль — один из основных символов традиционного орнамента народов Приамурья. Лёгкая подвижная форма подчёркивает природный рисунок дерева, поэтому каждая пара неповторима.",
    care: sharedCare,
  },
  {
    slug: "studs-triangle",
    name: "Треугольник",
    subtitle: "Пуссеты · японский вяз",
    category: "Серьги",
    collection: "На Пути",
    price: 1800,
    orderable: true,
    image: images.triangleModelNew,
    images: [images.triangleModelNew, images.triangleWhiteBox, images.triangleCardNew],
    material: woodMaterial,
    woodType,
    metal: "Сталь",
    dimensions: "Миниатюрный формат",
    stock: 8,
    description:
      "В равностороннем треугольнике соединяются макромир, микромир и человек — дух, душа и сознание. Миниатюрная форма сохраняет естественный рисунок дерева.",
    care: sharedCare,
  },
  {
    slug: "studs-amur-rhythm",
    name: "В ритме Амура",
    subtitle: "Пуссеты · японский вяз",
    category: "Серьги",
    collection: "В ритме Амура · Этника",
    price: 1800,
    orderable: true,
    image: images.triangleCard,
    images: [images.triangleCard, images.triangleStuds, images.triangleModel],
    material: woodMaterial,
    woodType,
    metal: "Сталь",
    dimensions: "Миниатюрный формат",
    stock: 6,
    description:
      "Линейка миниатюрных пуссет выполнена в форме символов бытования и верований коренных народов Приамурья.",
    variants: ["Рыбка", "Лодка", "Ящерица", "Спираль", "Лягушка", "Тигр", "Бабочка", "Грузило", "Поплавок"],
    care: sharedCare,
  },
  {
    slug: "amulet-seven-guardians",
    name: "Сэвэны-хранители",
    subtitle: "Амулет · японский вяз",
    category: "Подвески",
    collection: "Сэвэны-хранители",
    price: 4200,
    orderable: true,
    image: images.guardians,
    images: [images.guardians, images.spiralPack],
    material: "Массив натурального дерева",
    woodType,
    metal: "Стальная фурнитура",
    dimensions: "Композиция из трёх фигур",
    stock: 2,
    description:
      "Амулет объединяет антропоморфные и зооморфные образы: тигра, ящерицу, птицу, рыбу, человека и черепаху. Каждая композиция собирается вручную.",
    variants: ["Тигр", "Ящерица", "Птица", "Рыба", "Человек", "Черепаха"],
    care: sharedCare,
  },
  {
    slug: "pendant-spiral",
    name: "Амурская спираль",
    subtitle: "Подвеска · японский вяз",
    category: "Подвески",
    collection: "В ритме Амура · Этника",
    price: 3400,
    orderable: true,
    image: images.spiralPack,
    images: [images.spiralPack, images.spiralModel],
    material: woodMaterial,
    woodType,
    metal: "Сталь",
    dimensions: "Размер уточняется",
    stock: 4,
    description:
      "Традиционная спираль становится лаконичным знаком, соединяющим людей разных эпох и культур. Форма подчёркивает природную фактуру японского вяза.",
    care: sharedCare,
  },
  {
    slug: "figurine-seven-dyuli",
    name: "Сэвэн Дюли",
    subtitle: "Статуэтка · японский вяз",
    category: "Сувениры",
    collection: "Сэвэны-хранители",
    price: 5500,
    orderable: true,
    image: images.guardians,
    images: [images.guardians, images.spiralPack],
    material: "Массив натурального дерева",
    woodType,
    metal: "Без металла",
    dimensions: "Размер уточняется",
    stock: 1,
    description:
      "Дюли считался хранителем домашнего очага и покровителем семьи. Фигура вырезана из цельного массива и сохраняет живой рисунок древесины.",
    care: sharedCare,
  },
];

const completeCatalog: Product[] = [
  catalogProduct({
    slug: "earrings-amur-patterns",
    name: "Амурские узоры",
    subtitle: "Серьги · дерево и керамика",
    category: "Серьги",
    collection: "В ритме Амура · Этника",
    description: "Оригинальный нанайский орнамент соединён с акцентной керамикой ручной работы. Каждая пара неповторима, динамична и наполнена местным колоритом.",
    material: "Натуральное дерево, керамика ручной работы, стальная фурнитура",
  }),
  catalogProduct({
    slug: "studs-amur-patterns",
    name: "Амурские узоры",
    subtitle: "Пуссеты · натуральное дерево",
    category: "Серьги",
    collection: "В ритме Амура · Этника",
    description: "Оригинальный нанайский орнамент и выразительная фактура дерева делают каждую пару неповторимой.",
  }),
  catalogProduct({
    slug: "pendants-amur-patterns",
    name: "Амурские узоры",
    subtitle: "Подвеска · дерево и керамика",
    category: "Подвески",
    collection: "В ритме Амура · Этника",
    description: "Нанайский орнамент сочетается с акцентной керамикой ручной работы. Каждая подвеска существует в единственном природном рисунке.",
    material: "Натуральное дерево, керамика ручной работы, стальная фурнитура",
  }),
  catalogProduct({
    slug: "brooches-amur-rhythm",
    name: "В ритме Амура",
    subtitle: "Броши · силуэты флоры и фауны",
    category: "Броши",
    collection: "В ритме Амура · Эндемики",
    description: `${amurIntro} Линейка брошей представлена силуэтами животных, птиц и растений.`,
    variants: ["Кот", "Енот", "Дубовый лист", "Китовый хвост", "Лиса"],
    images: [images.broochBirdModel, images.broochBirdProduct, images.broochBirdCard],
  }),
  catalogProduct({
    slug: "pendants-amur-endemics",
    name: "В ритме Амура",
    subtitle: "Подвески · силуэты флоры и фауны",
    category: "Подвески",
    collection: "В ритме Амура · Эндемики",
    description: `${amurIntro} Подвески выполнены в виде лаконичных природных силуэтов.`,
    variants: ["Кот", "Енот", "Дубовый лист", "Китовый хвост", "Лиса", "Коготь", "Клык"],
  }),
  catalogProduct({
    slug: "figurine-whale-tail",
    name: "Китовый хвост",
    subtitle: "Статуэтка · натуральное дерево",
    category: "Сувениры",
    collection: "В ритме Амура · Эндемики",
    description: "Деревянная статуэтка в форме китового хвоста — образ свободы, глубины и природной силы Дальнего Востока.",
    metal: "Без металла",
  }),
  catalogProduct({
    slug: "earrings-seven-guardians",
    name: "Сэвэны-хранители",
    subtitle: "Серьги · японский вяз",
    category: "Серьги",
    collection: "Сэвэны-хранители",
    description: `${guardiansIntro} Можно выбрать одинаковую или асимметричную пару фигурок.`,
    variants: ["Тигр", "Ящерица", "Птица", "Рыба", "Человек", "Черепаха"],
  }),
  catalogProduct({
    slug: "pendant-seven-guardians",
    name: "Сэвэны-хранители",
    subtitle: "Подвеска · японский вяз",
    category: "Подвески",
    collection: "Сэвэны-хранители",
    description: guardiansIntro,
    variants: ["Исэлэ — интуиция и связь миров", "Птица счастья", "Дюли — хранитель семьи"],
  }),
  catalogProduct({
    slug: "bracelet-seven-guardians",
    name: "Сэвэны-хранители",
    subtitle: "Браслет · японский вяз",
    category: "Браслеты",
    collection: "Сэвэны-хранители",
    description: `${guardiansIntro} Центральная фигурка становится личным символом и акцентом браслета.`,
    variants: ["Исэлэ", "Тигр", "Рыба", "Черепаха", "Птица", "Человек", "Горы", "Сердце"],
  }),
  catalogProduct({
    slug: "keychain-seven-guardians",
    name: "Сэвэны-хранители",
    subtitle: "Объёмный брелок · японский вяз",
    category: "Сувениры",
    collection: "Сэвэны-хранители",
    description: "Объёмный брелок вырезан из массива японского вяза и сохраняет выразительный силуэт выбранного хранителя.",
    variants: ["Дюли", "Исэлэ", "Птица счастья"],
  }),
  catalogProduct({
    slug: "mini-keychain-seven-guardians",
    name: "Мини-сэвэн",
    subtitle: "Мини-брелок · японский вяз",
    category: "Сувениры",
    collection: "Сэвэны-хранители",
    description: "Миниатюрная антропоморфная или зооморфная фигурка из массива японского вяза.",
    variants: ["Исэлэ", "Тигр", "Рыба", "Черепаха", "Птица", "Дюли", "Человек"],
    dimensions: "1 × 2 см",
  }),
  catalogProduct({
    slug: "figurine-seven-dyuli-large",
    name: "Сэвэн Дюли — большой",
    subtitle: "Статуэтка · японский вяз",
    category: "Сувениры",
    collection: "Сэвэны-хранители",
    description: "Увеличенная статуэтка хранителя домашнего очага и покровителя семьи, выполненная из цельного массива японского вяза.",
    metal: "Без металла",
  }),
  catalogProduct({
    slug: "figurine-winged-ayami",
    name: "Крылатый Аями",
    subtitle: "Статуэтка · японский вяз",
    category: "Сувениры",
    collection: "Сэвэны-хранители",
    description: "Культовый образ в авторской интерпретации JE TIKI, вырезанный из цельного массива дерева.",
    metal: "Без металла",
  }),
  catalogProduct({
    slug: "paired-bracelets-triangle",
    name: "Треугольники",
    subtitle: "Парные браслеты · чёрное и светлое дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Парные браслеты объединяет знак равностороннего треугольника — образ единства макромира, микромира и человека.`,
    variants: ["Чёрный треугольник", "Светлый треугольник"],
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "paired-bracelets-circle",
    name: "Круги",
    subtitle: "Парные браслеты · чёрное и светлое дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Круг символизирует бесконечность, единообразие и круговорот бытия — два браслета читаются как инь и янь.`,
    variants: ["Чёрный круг", "Светлый круг"],
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-cross",
    name: "Крест",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Древний знак связывается с небом, солнечными образами, защитой и процветанием.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-triangle",
    name: "Треугольник",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Равносторонний треугольник выражает единство духа, души и сознания.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-circle",
    name: "Круг",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Круг — символ небесного совершенства, бесконечности и круговорота бытия.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-heart",
    name: "Сердце",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Лаконичный знак сердца сохраняет тепло природного материала и становится личным символом.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-mountains",
    name: "Горы",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Силуэт гор напоминает о движении, высоте и свободе дальневосточного ландшафта.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-snowboard",
    name: "Сноуборд",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Миниатюрный знак для тех, кто выбирает снег, склон и движение.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "bracelet-surf",
    name: "Сёрф",
    subtitle: "Браслет · натуральное дерево",
    category: "Браслеты",
    collection: "На Пути",
    description: `${pathIntro} Миниатюрный знак движения по воде и внутренней свободы.`,
    dimensions: "Регулируемая затяжка",
  }),
  catalogProduct({
    slug: "studs-circle",
    name: "Круг",
    subtitle: "Пуссеты · натуральное дерево",
    category: "Серьги",
    collection: "На Пути",
    description: `${pathIntro} Миниатюрный круг подчёркивает естественный оттенок и рисунок дерева.`,
  }),
  catalogProduct({
    slug: "corporate-bookmark",
    name: "Закладка с гравировкой",
    subtitle: "Для мероприятий · от 350 ₽ при заказе от 50 шт.",
    category: "Для бизнеса",
    collection: "Корпоративные сувениры",
    description: "Лаконичная деревянная закладка с тематической гравировкой: логотипом, надписью, нанайским или удэгейским орнаментом.",
    dimensions: "18 × 3 см",
    material: "Массив дальневосточного вяза или ясеня",
    metal: "Без металла",
    price: 350,
  }),
  catalogProduct({
    slug: "corporate-keychain-guardian",
    name: "Сэвэн-хранитель",
    subtitle: "Брелок для мероприятий · от 550 ₽ при заказе от 50 шт.",
    category: "Для бизнеса",
    collection: "Корпоративные сувениры",
    description: "Объёмный брелок в форме Сэвэна Дюли. Дизайн можно адаптировать под символ мероприятия или логотип форума.",
    dimensions: "8 × 2 см",
    price: 550,
  }),
  catalogProduct({
    slug: "corporate-mini-bracelet-keychain",
    name: "Мини-браслет или брелок",
    subtitle: "Для мероприятий · от 280 ₽ при заказе от 50 шт.",
    category: "Для бизнеса",
    collection: "Корпоративные сувениры",
    description: "Миниатюрное изделие с символикой Хабаровского края, форума или другого мероприятия.",
    dimensions: "1 × 2 см",
    price: 280,
  }),
];

export const products: Product[] = [...availableProducts, ...completeCatalog];
export const featuredProducts = availableProducts;

export const heroImage = images.spiralModel;
export const woodImage = images.guardians;
export const silverImage = images.triangleStuds;

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
