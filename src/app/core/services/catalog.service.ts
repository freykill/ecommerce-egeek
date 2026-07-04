import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  ApiMeta,
  CatalogTaxonomy,
  ProductCard,
  ProductDetail,
  ProductQuery,
  StoreCategory,
} from '../models';

/** Lectura del catálogo público: categorías, marcas, productos y detalle. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  getCategories(): Observable<StoreCategory[]> {
    return this.api.get<StoreCategory[]>('/store/categories');
  }

  getBrands(): Observable<CatalogTaxonomy[]> {
    return this.api.get<CatalogTaxonomy[]>('/store/brands');
  }

  getProducts(
    query: ProductQuery = {},
  ): Observable<{ data: ProductCard[]; meta: ApiMeta | null }> {
    return this.api.getPaged<ProductCard[]>('/store/products', {
      search: query.search,
      category: query.category,
      brand: query.brand,
      page: query.page,
      limit: query.limit,
    });
  }

  getProduct(slug: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/store/products/${encodeURIComponent(slug)}`);
  }
}
