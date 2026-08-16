export const CATEGORY_SLUGS = [
  "earrings",
  "pendants",
  "bracelets",
  "keychains",
  "gifts",
] as const;

export type ProductCategory = (typeof CATEGORY_SLUGS)[number];

export const PRODUCT_SLUGS = [
  "tikhaya-bukhta",
  "severny-veter",
  "svet-nad-amurom",
  "kedrovaya-liniya",
  "istok",
  "tuman-nad-morem",
  "techenie",
  "kamenny-bereg",
  "taezhnaya-tropa",
  "polden",
  "mayak",
  "sled-taygi",
  "rechnoy-kamen",
  "gorizont",
  "teply-bereg",
] as const;

export type LocalProductSlug = (typeof PRODUCT_SLUGS)[number];

/** Slug remains open-ended so products added in Supabase do not require a code change. */
export type ProductSlug = string;

export interface Category {
  slug: ProductCategory;
  name: string;
  singularName: string;
  description: string;
  image: string;
  imageAlt: string;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: ProductSlug;
  category: ProductCategory;
  price: number;
  oldPrice: number | null;
  images: readonly ProductImage[];
  shortDescription: string;
  description: string;
  materials: readonly string[];
  woodType: string | null;
  metal: string | null;
  dimensions: string;
  /** Вес изделия в граммах. */
  weight: number;
  fastening: string | null;
  sku: string;
  isAvailable: boolean;
  stock: number;
  productionTime: string;
  care: readonly string[];
  wildberriesUrl: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CatalogSort =
  | "featured"
  | "newest"
  | "popular"
  | "price-asc"
  | "price-desc";

export type AvailabilityFilter = "all" | "in-stock" | "made-to-order";

export interface ProductFilters {
  category?: ProductCategory;
  materials?: readonly string[];
  availability?: AvailabilityFilter;
  search?: string;
  sort?: CatalogSort;
}

export interface ProductRepository {
  getAll(): Promise<readonly Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
}

export interface SupabaseProductImageRow {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
}

export interface SupabaseProductRow {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  price: number;
  old_price: number | null;
  materials: string[];
  wood_type: string | null;
  metal: string | null;
  dimensions: string;
  weight: number;
  fastening: string | null;
  sku: string;
  stock: number;
  production_time: string;
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  wildberries_url: string | null;
  created_at: string;
  updated_at: string;
  product_images: SupabaseProductImageRow[] | null;
}
