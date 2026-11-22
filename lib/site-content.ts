export const siteContentDefaults = {
  hero: {
    eyebrow: "JE TIKI · Хабаровск",
    title: "Украшения из дерева с берегов Амура",
    intro: "",
    cta: "Перейти в каталог",
  },
  home_intro: {
    eyebrow: "О JE TIKI",
    title: "Современные предметы, в которых слышен Дальний Восток.",
    paragraph1: "Мы работаем с японским вязом и другими дальневосточными породами и сохраняем рисунок дерева.",
    paragraph2: "В формах украшений мы используем нанайский орнамент, природные мотивы Приамурья и простую геометрию.",
  },
  about: {
    eyebrow: "Мастерская",
    title: "JE TIKI создаёт украшения и небольшие объекты в Хабаровске.",
    paragraph1: "Тёплые, тактильные вещи с локальным характером — для повседневной жизни, подарка и памяти о месте.",
    paragraph2: "Кроме украшений мы создаём сувениры и небольшие серии для событий и бизнеса.",
  },
  contacts: { phone: "89147771252", footer_text: "Украшения из дерева с берегов Амура" },
};

export const storefrontStorageKey = "je-tiki:storefront-updated";

export type SiteContentKey = keyof typeof siteContentDefaults;

export function siteContentFields<K extends SiteContentKey>(key: K, saved?: Record<string, unknown>) {
  const defaults = siteContentDefaults[key];
  return Object.fromEntries(Object.entries(defaults).map(([field, fallback]) => [
    field,
    typeof saved?.[field] === "string" ? saved[field] : fallback,
  ])) as { [Field in keyof (typeof siteContentDefaults)[K]]: string };
}
