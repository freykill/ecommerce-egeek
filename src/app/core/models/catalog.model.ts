/** Marcas activas (GET /store/brands) y base de taxonomía para filtros. */
export interface CatalogTaxonomy {
  name: string;
  slug: string; // úsalo como filtro en /store/products
  description: string | null;
}

/**
 * Categorías activas (GET /store/categories). Además de la base, traen
 * presentación visual (icon/color) y el orden manual del admin (ya vienen
 * ordenadas por `sortOrder`).
 */
export interface StoreCategory extends CatalogTaxonomy {
  icon: string | null; // clase de icono (ej. "pi pi-tag") o emoji
  color: string | null; // hex de acento (ej. "#3B82F6")
  sortOrder: number; // orden en el menú
}

/** Categoría anidada en un producto (catálogo/detalle), para pintar su badge. */
export interface ProductCategoryRef {
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

/** Tarjeta de producto para la grilla (GET /store/products). */
export interface ProductCard {
  idProduct: number;
  name: string;
  slug: string; // úsalo para el detalle
  isFeatured: boolean;
  category: ProductCategoryRef;
  brand: { name: string; slug: string } | null;
  mainImage: string | null; // URL de la imagen principal
  priceFrom: number | null; // precio final más bajo entre sus variantes
  inStock: boolean; // ¿alguna variante con stock?
}

/** Detalle completo (GET /store/products/:slug). */
export interface ProductDetail {
  idProduct: number;
  name: string;
  slug: string;
  description: string | null;
  taxRate: number; // % de impuesto del producto
  isFeatured: boolean;
  category: ProductCategoryRef;
  brand: { name: string; slug: string } | null;
  variants: Variant[];
  images: ProductImage[];
}

export interface Variant {
  idVariant: number; // <-- esto es lo que se envía al checkout
  name: string; // nombre de la variante, ej. "Talla M / Rojo"
  productName: string; // nombre del producto padre, ej. "Camiseta"
  productSlug: string; // slug del producto padre (para enlazar/agrupar)
  sku: string | null;
  price: number; // precio de lista
  finalPrice: number; // precio con descuento aplicado
  hasDiscount: boolean;
  stock: number;
  inStock: boolean;
}

export interface ProductImage {
  imageUrl: string;
  altText: string | null;
  isMain: boolean;
  idVariant: number | null; // null = imagen general; si no, imagen de esa variante
}

/** Filtros de catálogo (todos opcionales). */
export interface ProductQuery {
  search?: string; // máx 120, busca en nombre y descripción
  category?: string; // slug de categoría
  brand?: string; // slug de marca
  page?: number; // >= 1, default 1
  limit?: number; // >= 1, default 20, tope 60
}
