import type { Product } from "@/lib/types";

type ProductRecord = {
  slug: string; name: string; subtitle?: string | null; description?: string | null; price: number;
  orderable: boolean; stock_quantity: number; material?: string | null; wood_type?: string | null;
  metal?: string | null; dimensions?: string | null; care?: string | null;
  categories?: { name?: string } | { name?: string }[] | null;
  collections?: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
  product_images?: Array<{ storage_path?: string | null; external_url?: string | null; sort_order?: number }>;
};

const publicStorageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/product-media/`;

export function mapSupabaseProduct(row: ProductRecord, fallback?: Product): Product {
  const categoryRecord = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const collectionRecord = Array.isArray(row.collections) ? row.collections[0] : row.collections;
  const images = (row.product_images ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => image.external_url || (image.storage_path ? `${publicStorageBase}${image.storage_path}` : ""))
    .filter(Boolean);
  return {
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || fallback?.subtitle || "Ручная работа JE TIKI",
    category: (categoryRecord?.name || fallback?.category || "Сувениры") as Product["category"],
    price: row.price,
    orderable: row.orderable,
    // Supabase is the source of truth for the product gallery. An empty gallery
    // must stay empty after an admin deletes every image; otherwise old bundled
    // catalogue photography would silently reappear as a fallback.
    image: images[0] ?? null,
    images,
    collection: collectionRecord?.name || fallback?.collection || "JE TIKI",
    variants: fallback?.variants,
    material: row.material || fallback?.material || "Натуральное дерево",
    woodType: row.wood_type || fallback?.woodType || "Дальневосточные породы дерева",
    metal: row.metal || fallback?.metal || "Сталь",
    dimensions: row.dimensions || fallback?.dimensions || "Уточняются",
    stock: row.stock_quantity,
    description: row.description || fallback?.description || "Предмет ручной работы JE TIKI.",
    care: row.care || fallback?.care || "Берегите от воды и прямого солнца.",
  };
}
