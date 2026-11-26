const russianLetters: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function productSlug(name: string) {
  return name.normalize("NFC").toLowerCase()
    .replace(/[а-яё]/g, (letter) => russianLetters[letter])
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100).replace(/-$/, "") || "tovar";
}

export function availableProductSlug(name: string, taken: Set<string>) {
  const base = productSlug(name);
  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix++) slug = `${base}-${suffix}`;
  return slug;
}

export function productHref(slug: string, catalogQuery = "") {
  const query = new URLSearchParams(catalogQuery);
  query.set("slug", slug);
  return `/product/?${query}`;
}
