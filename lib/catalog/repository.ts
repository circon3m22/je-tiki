import {
  CATEGORY_SLUGS,
  type Product,
  type ProductCategory,
  type ProductImage,
  type ProductRepository,
  type SupabaseProductImageRow,
  type SupabaseProductRow,
} from "@/lib/types/catalog";
import { getCareRecommendations, localProducts } from "@/lib/catalog/products";

const PRODUCT_SELECT = [
  "id",
  "name",
  "slug",
  "short_description",
  "description",
  "category",
  "price",
  "old_price",
  "materials",
  "wood_type",
  "metal",
  "dimensions",
  "weight",
  "fastening",
  "sku",
  "stock",
  "production_time",
  "is_available",
  "is_featured",
  "is_new",
  "is_bestseller",
  "wildberries_url",
  "created_at",
  "updated_at",
  "product_images(id,image_url,alt_text,sort_order)",
].join(",");

export interface SupabaseCatalogConfig {
  url: string;
  publishableKey: string;
  fetcher?: typeof fetch;
}

function isProductCategory(value: string): value is ProductCategory {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

function isSafePublicUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidImageSource(value: string): boolean {
  if (value.startsWith("/")) return true;
  return isSafePublicUrl(value);
}

function toProductImage(row: SupabaseProductImageRow): ProductImage | null {
  if (!row.image_url || !isValidImageSource(row.image_url)) return null;

  return {
    id: row.id,
    src: row.image_url,
    alt: row.alt_text?.trim() || "Изделие Je Tiki",
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
  };
}

export function mapSupabaseProduct(row: SupabaseProductRow): Product {
  if (!row.slug?.trim()) throw new Error("Supabase product has no slug.");
  if (!isProductCategory(row.category)) {
    throw new Error(`Unknown product category: ${row.category}`);
  }
  if (!Number.isInteger(row.price) || row.price < 0) {
    throw new Error(`Invalid price for product ${row.slug}.`);
  }
  if (!Number.isInteger(row.stock) || row.stock < 0) {
    throw new Error(`Invalid stock for product ${row.slug}.`);
  }
  if (!Number.isInteger(row.weight) || row.weight < 0) {
    throw new Error(`Invalid weight for product ${row.slug}.`);
  }

  const localFallback = localProducts.find(
    (product) => product.slug === row.slug || product.sku === row.sku,
  );
  const databaseImages = (row.product_images ?? [])
    .map(toProductImage)
    .filter((image): image is ProductImage => image !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const images =
    databaseImages.length > 0 ? databaseImages : localFallback?.images;

  if (!images?.length) {
    throw new Error(`Product ${row.slug} has no valid images.`);
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    price: row.price,
    oldPrice:
      row.old_price !== null && Number.isInteger(row.old_price)
        ? row.old_price
        : null,
    images,
    shortDescription: row.short_description,
    description: row.description,
    materials: Array.isArray(row.materials)
      ? row.materials.filter((material) => typeof material === "string")
      : [],
    woodType: row.wood_type,
    metal: row.metal,
    dimensions: row.dimensions,
    weight: row.weight,
    fastening: row.fastening,
    sku: row.sku,
    isAvailable: row.is_available,
    stock: row.stock,
    productionTime: row.production_time,
    care: localFallback?.care ?? getCareRecommendations(row.category),
    wildberriesUrl: isSafePublicUrl(row.wildberries_url)
      ? row.wildberries_url
      : null,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const localProductRepository: ProductRepository = {
  async getAll() {
    return localProducts;
  },
  async getBySlug(slug) {
    return localProducts.find((product) => product.slug === slug) ?? null;
  },
};

export class SupabaseRestProductRepository implements ProductRepository {
  constructor(private readonly config: SupabaseCatalogConfig) {}

  async getAll(): Promise<readonly Product[]> {
    return this.fetchProducts();
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const products = await this.fetchProducts(slug);
    return products[0] ?? null;
  }

  private async fetchProducts(slug?: string): Promise<readonly Product[]> {
    const url = new URL(
      "rest/v1/products",
      `${this.config.url.replace(/\/+$/, "")}/`,
    );
    url.searchParams.set("select", PRODUCT_SELECT);
    url.searchParams.set("is_available", "eq.true");
    url.searchParams.set("order", "created_at.desc");

    if (slug) {
      url.searchParams.set("slug", `eq.${slug}`);
      url.searchParams.set("limit", "1");
    }

    const fetcher = this.config.fetcher ?? fetch;
    const response = await fetcher(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        apikey: this.config.publishableKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Supabase catalog request failed with ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Supabase catalog returned an invalid response.");
    }

    return (payload as SupabaseProductRow[]).map(mapSupabaseProduct);
  }
}

export class FallbackProductRepository implements ProductRepository {
  constructor(
    private readonly primary: ProductRepository,
    private readonly fallback: ProductRepository,
  ) {}

  async getAll(): Promise<readonly Product[]> {
    try {
      return await this.primary.getAll();
    } catch {
      return this.fallback.getAll();
    }
  }

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      return await this.primary.getBySlug(slug);
    } catch {
      return this.fallback.getBySlug(slug);
    }
  }
}

export function resolveSupabaseCatalogConfig(): SupabaseCatalogConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return url && publishableKey ? { url, publishableKey } : null;
}

export function createCatalogRepository(
  config: SupabaseCatalogConfig | null = resolveSupabaseCatalogConfig(),
): ProductRepository {
  if (!config) return localProductRepository;

  return new FallbackProductRepository(
    new SupabaseRestProductRepository(config),
    localProductRepository,
  );
}

export const productRepository = createCatalogRepository();
