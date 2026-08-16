import { productRepository } from "@/lib/catalog/repository";
import type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductRepository,
} from "@/lib/types/catalog";

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function compareNewest(left: Product, right: Product): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

function filterProducts(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const search = filters.search ? normalizeSearchValue(filters.search) : "";
  const materials = filters.materials?.map(normalizeSearchValue) ?? [];

  return products.filter((product) => {
    if (!product.isAvailable) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.availability === "in-stock" && product.stock === 0)
      return false;
    if (filters.availability === "made-to-order" && product.stock > 0)
      return false;

    if (materials.length > 0) {
      const productMaterials = product.materials.map(normalizeSearchValue);
      if (!materials.some((material) => productMaterials.includes(material))) {
        return false;
      }
    }

    if (search) {
      const searchable = [
        product.name,
        product.shortDescription,
        product.description,
        product.woodType ?? "",
        product.metal ?? "",
        product.sku,
        ...product.materials,
      ]
        .join(" ")
        .toLocaleLowerCase("ru-RU");

      if (!searchable.includes(search)) return false;
    }

    return true;
  });
}

function sortProducts(
  products: readonly Product[],
  sort: ProductFilters["sort"] = "featured",
): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((left, right) => left.price - right.price);
    case "price-desc":
      return sorted.sort((left, right) => right.price - left.price);
    case "newest":
      return sorted.sort(compareNewest);
    case "popular":
      return sorted.sort(
        (left, right) =>
          Number(right.isBestseller) - Number(left.isBestseller) ||
          Number(right.isFeatured) - Number(left.isFeatured) ||
          right.stock - left.stock ||
          compareNewest(left, right),
      );
    case "featured":
    default:
      return sorted.sort(
        (left, right) =>
          Number(right.isFeatured) - Number(left.isFeatured) ||
          Number(right.isBestseller) - Number(left.isBestseller) ||
          Number(right.isNew) - Number(left.isNew) ||
          compareNewest(left, right),
      );
  }
}

export async function getProducts(
  filters: ProductFilters = {},
  repository: ProductRepository = productRepository,
): Promise<Product[]> {
  const products = await repository.getAll();
  return sortProducts(filterProducts(products, filters), filters.sort);
}

export async function getProductBySlug(
  slug: string,
  repository: ProductRepository = productRepository,
): Promise<Product | null> {
  const product = await repository.getBySlug(slug);
  return product?.isAvailable ? product : null;
}

export async function getProductsByCategory(
  category: ProductCategory,
  filters: Omit<ProductFilters, "category"> = {},
  repository: ProductRepository = productRepository,
): Promise<Product[]> {
  return getProducts({ ...filters, category }, repository);
}

export async function getFeaturedProducts(
  limit = 6,
  repository: ProductRepository = productRepository,
): Promise<Product[]> {
  const products = await getProducts({ sort: "featured" }, repository);
  return products.filter((product) => product.isFeatured).slice(0, limit);
}

export async function getRelatedProducts(
  current: Product | string,
  limit = 4,
  repository: ProductRepository = productRepository,
): Promise<Product[]> {
  const product =
    typeof current === "string"
      ? await getProductBySlug(current, repository)
      : current;

  if (!product) return [];

  const products = await getProducts({}, repository);
  return products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({
      candidate,
      score:
        Number(candidate.category === product.category) * 10 +
        candidate.materials.filter((material) =>
          product.materials.includes(material),
        ).length *
          2 +
        Number(candidate.isBestseller) +
        Number(candidate.isFeatured),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        compareNewest(left.candidate, right.candidate),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
