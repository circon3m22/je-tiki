export type Category =
  | "Серьги"
  | "Подвески"
  | "Броши"
  | "Браслеты"
  | "Сувениры"
  | "Для бизнеса";

export type Product = {
  slug: string;
  name: string;
  subtitle: string;
  category: Category;
  price: number;
  orderable: boolean;
  image: string | null;
  images: string[];
  collection: string;
  variants?: string[];
  material: string;
  woodType: string;
  metal: string;
  dimensions: string;
  stock: number;
  description: string;
  care: string;
};

export type CartLine = {
  slug: string;
  quantity: number;
};
