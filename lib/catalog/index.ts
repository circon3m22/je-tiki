export { categories, getCategory } from "@/lib/catalog/categories";
export {
  catalogMaterials,
  localProductCounts,
  localProducts,
  products,
} from "@/lib/catalog/products";
export {
  createCatalogRepository,
  localProductRepository,
  productRepository,
  resolveSupabaseCatalogConfig,
} from "@/lib/catalog/repository";
export {
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getRelatedProducts,
} from "@/lib/catalog/service";
export type {
  AvailabilityFilter,
  CatalogSort,
  Category,
  Product,
  ProductCategory,
  ProductFilters,
  ProductImage,
  ProductRepository,
} from "@/lib/types/catalog";
