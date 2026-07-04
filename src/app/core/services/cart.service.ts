import { Injectable, computed, effect, signal } from '@angular/core';
import { CheckoutItem, ProductDetail, Variant } from '../models';

/**
 * Una línea del carrito. Guarda una "foto" del precio/stock al momento de
 * agregar (para mostrar). El total real SIEMPRE lo confirma el checkout en el
 * servidor; nunca se manda un precio desde el front.
 */
export interface CartItem {
  idVariant: number;
  productSlug: string;
  productName: string;
  variantName: string;
  image: string | null;
  unitPrice: number; // finalPrice de la variante (snapshot, solo para mostrar)
  stock: number; // stock disponible al agregar (para topar la cantidad)
  quantity: number;
}

const STORAGE_KEY = 'egeek_cart_v1';

/**
 * Carrito basado en signals + persistencia en localStorage. Es la única fuente
 * de verdad del carrito; el checkout arma su payload con `toCheckoutItems()`.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.restore());

  /** Líneas del carrito (solo lectura). */
  readonly items = this._items.asReadonly();

  /** Cantidad total de unidades (para el badge del header). */
  readonly count = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0),
  );

  /** Cantidad de líneas distintas. */
  readonly lineCount = computed(() => this._items().length);

  /** Subtotal estimado (referencial; el real lo confirma el checkout). */
  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Persiste ante cualquier cambio.
    effect(() => this.persist(this._items()));
  }

  /**
   * Agrega una variante (o suma cantidad si ya está). Respeta el stock máximo.
   * `product` aporta nombre/slug/imagen para mostrar la línea sin re-consultar.
   */
  add(product: ProductDetail, variant: Variant, quantity = 1): void {
    const image =
      product.images.find((img) => img.idVariant === variant.idVariant)?.imageUrl ??
      product.images.find((img) => img.isMain)?.imageUrl ??
      product.images[0]?.imageUrl ??
      null;

    this._items.update((items) => {
      const existing = items.find((it) => it.idVariant === variant.idVariant);
      if (existing) {
        return items.map((it) =>
          it.idVariant === variant.idVariant
            ? { ...it, quantity: this.clampQty(it.quantity + quantity, variant.stock) }
            : it,
        );
      }
      const line: CartItem = {
        idVariant: variant.idVariant,
        productSlug: product.slug,
        productName: product.name,
        variantName: variant.name,
        image,
        unitPrice: variant.finalPrice,
        stock: variant.stock,
        quantity: this.clampQty(quantity, variant.stock),
      };
      return [...items, line];
    });
  }

  setQuantity(idVariant: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(idVariant);
      return;
    }
    this._items.update((items) =>
      items.map((it) =>
        it.idVariant === idVariant
          ? { ...it, quantity: this.clampQty(quantity, it.stock) }
          : it,
      ),
    );
  }

  increment(idVariant: number): void {
    const item = this._items().find((it) => it.idVariant === idVariant);
    if (item) this.setQuantity(idVariant, item.quantity + 1);
  }

  decrement(idVariant: number): void {
    const item = this._items().find((it) => it.idVariant === idVariant);
    if (item) this.setQuantity(idVariant, item.quantity - 1);
  }

  remove(idVariant: number): void {
    this._items.update((items) => items.filter((it) => it.idVariant !== idVariant));
  }

  clear(): void {
    this._items.set([]);
  }

  /** Payload mínimo que espera el checkout: solo idVariant + quantity. */
  toCheckoutItems(): CheckoutItem[] {
    return this._items().map((it) => ({
      idVariant: it.idVariant,
      quantity: it.quantity,
    }));
  }

  private clampQty(qty: number, stock: number): number {
    const max = stock > 0 ? stock : 1;
    return Math.max(1, Math.min(qty, max));
  }

  private persist(items: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* localStorage no disponible (modo privado, SSR): ignoramos. */
    }
  }

  private restore(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
