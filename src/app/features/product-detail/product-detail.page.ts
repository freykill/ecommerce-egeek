import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { ProductDetail, ProductImage, Variant } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { IconComponent } from '../../shared/ui/icon.component';

interface DetailVm {
  status: 'loading' | 'ok' | 'error';
  product: ProductDetail | null;
  message?: string;
}

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MoneyPipe, IconComponent, EmptyStateComponent],
  template: `
    <section class="surface-page py-8">
      @switch (vm().status) {
        <!-- ---------------------------------------------------------- LOADING -->
        @case ('loading') {
          <div class="grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div class="skeleton aspect-square rounded-[var(--radius-lg)]"></div>
            <div class="space-y-4 pt-2">
              <div class="skeleton h-3 w-1/3 rounded"></div>
              <div class="skeleton h-9 w-3/4 rounded"></div>
              <div class="skeleton h-10 w-1/2 rounded"></div>
              <div class="flex gap-2">
                <div class="skeleton h-10 w-24 rounded-[var(--radius-sm)]"></div>
                <div class="skeleton h-10 w-24 rounded-[var(--radius-sm)]"></div>
              </div>
              <div class="skeleton h-13 w-full rounded-[var(--radius-sm)]"></div>
              <div class="skeleton h-24 w-full rounded-[var(--radius)]"></div>
            </div>
          </div>
        }

        <!-- ------------------------------------------------------------ ERROR -->
        @case ('error') {
          <app-empty-state
            icon="alert"
            tone="danger"
            title="No pudimos cargar el producto"
            [message]="vm().message ?? 'Intenta de nuevo en unos segundos.'"
          >
            <button type="button" class="btn btn-dark" (click)="retry()">Reintentar</button>
            <a routerLink="/" class="btn btn-outline">Volver al catálogo</a>
          </app-empty-state>
        }

        <!-- --------------------------------------------------------------- OK -->
        @case ('ok') {
          @if (vm().product; as product) {
            <!-- Breadcrumb -->
            <nav
              class="mb-7 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em]"
            >
              <a routerLink="/" class="text-ink-mute transition-colors hover:text-ink">
                Catálogo
              </a>
              <span class="text-ink-mute">/</span>
              <a
                routerLink="/"
                [queryParams]="{ category: product.category.slug }"
                class="text-ink-mute transition-colors hover:text-ink"
              >
                {{ product.category.name }}
              </a>
              <span class="text-ink-mute">/</span>
              <span class="truncate text-ink">{{ product.name }}</span>
            </nav>

            <div class="grid gap-8 lg:grid-cols-2 lg:gap-14">
              <!-- ============================================ GALERÍA (izq) -->
              <div class="lg:sticky lg:top-24 lg:self-start">
                <div
                  class="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface-muted"
                >
                  @if (selectedImage(); as img) {
                    <img
                      [src]="img.imageUrl"
                      [alt]="img.altText || product.name"
                      class="h-full w-full object-cover"
                    />
                  } @else {
                    <div class="flex h-full w-full items-center justify-center text-ink-mute">
                      <app-icon name="box" [size]="72" />
                    </div>
                  }

                  @if (product.isFeatured) {
                    <span class="pill absolute left-4 top-4 bg-ink text-white">Destacado</span>
                  }

                  <!-- Compartir -->
                  <button
                    type="button"
                    class="icon-btn absolute right-3 top-3 border border-line bg-surface/95"
                    (click)="share(product)"
                    [attr.aria-label]="shared() ? 'Enlace copiado' : 'Compartir'"
                  >
                    <app-icon [name]="shared() ? 'check' : 'share'" [size]="17" />
                  </button>
                </div>

                <!-- Miniaturas -->
                @if (product.images.length > 1) {
                  <div class="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
                    @for (img of product.images; track img.imageUrl) {
                      <button
                        type="button"
                        (click)="selectImage(img)"
                        class="aspect-square h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border bg-surface-muted transition-all"
                        [class.border-ink]="selectedImage()?.imageUrl === img.imageUrl"
                        [class.border-line]="selectedImage()?.imageUrl !== img.imageUrl"
                        [class.opacity-55]="selectedImage()?.imageUrl !== img.imageUrl"
                        [attr.aria-label]="img.altText || product.name"
                      >
                        <img
                          [src]="img.imageUrl"
                          [alt]="img.altText || product.name"
                          class="h-full w-full object-cover"
                        />
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- =============================================== INFO (der) -->
              <div>
                <!-- Categoría / marca -->
                <div class="flex flex-wrap items-center gap-2">
                  <a
                    routerLink="/"
                    [queryParams]="{ category: product.category.slug }"
                    class="pill border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
                  >
                    {{ product.category.name }}
                  </a>
                  @if (product.brand; as brand) {
                    <a
                      routerLink="/"
                      [queryParams]="{ brand: brand.slug }"
                      class="pill border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {{ brand.name }}
                    </a>
                  }
                </div>

                <h1
                  class="mt-4 text-3xl font-[650] leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl"
                >
                  {{ product.name }}
                </h1>

                <!-- Precio -->
                <div class="mt-5">
                  @if (selectedVariant(); as v) {
                    <div class="flex flex-wrap items-baseline gap-3">
                      <span class="text-3xl font-semibold tracking-tight text-ink tabular-nums">
                        {{ v.finalPrice | money }}
                      </span>
                      @if (v.hasDiscount) {
                        <span class="text-lg text-ink-mute line-through tabular-nums">
                          {{ v.price | money }}
                        </span>
                        <span class="pill bg-ink text-white">−{{ discountPercent() }}%</span>
                      }
                    </div>
                    @if (settings()?.pricesIncludeTax) {
                      <p class="meta mt-2">IGV incluido ({{ product.taxRate }}%)</p>
                    }
                  } @else {
                    <p class="text-lg font-medium text-ink-soft">Precio a consultar</p>
                  }
                </div>

                <!-- ------------------------------------- CAJA DE COMPRA -->
                <div class="mt-6 border-t border-line pt-6">
                  <!-- Variantes -->
                  @if (product.variants.length > 0) {
                    <div>
                      <span class="meta">Elige una opción</span>
                      <div class="mt-3 flex flex-wrap gap-2">
                        @for (variant of product.variants; track variant.idVariant) {
                          <button
                            type="button"
                            class="chip"
                            [attr.data-active]="selectedVariant()?.idVariant === variant.idVariant"
                            [disabled]="!variant.inStock"
                            [class.line-through]="!variant.inStock"
                            [class.opacity-40]="!variant.inStock"
                            [class.cursor-not-allowed]="!variant.inStock"
                            [title]="variant.inStock ? variant.name : variant.name + ' (agotado)'"
                            (click)="selectVariant(variant)"
                          >
                            {{ variant.name }}
                          </button>
                        }
                      </div>

                      @if (selectedVariant(); as v) {
                        @if (v.inStock && v.stock <= 5) {
                          <p class="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.08em] text-warning">
                            <app-icon name="bolt" [size]="13" /> Últimas {{ v.stock }} unidades
                          </p>
                        } @else if (v.inStock) {
                          <p class="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.08em] text-success">
                            <app-icon name="check" [size]="13" /> En stock
                          </p>
                        }
                      }
                    </div>
                  }

                  <!-- Acciones -->
                  @if (hasAnyStock()) {
                    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      @if (canAdd()) {
                        <div
                          class="inline-flex items-center rounded-[var(--radius-sm)] border border-line-strong bg-surface"
                        >
                          <button
                            type="button"
                            class="grid h-12 w-11 place-items-center text-ink transition-colors hover:text-brand disabled:opacity-40"
                            [disabled]="qty() <= 1"
                            (click)="decQty()"
                            aria-label="Disminuir cantidad"
                          >
                            <app-icon name="minus" [size]="16" />
                          </button>
                          <span
                            class="w-9 text-center text-base font-semibold tabular-nums text-ink"
                          >
                            {{ qty() }}
                          </span>
                          <button
                            type="button"
                            class="grid h-12 w-11 place-items-center text-ink transition-colors hover:text-brand disabled:opacity-40"
                            [disabled]="qty() >= (selectedVariant()?.stock ?? 1)"
                            (click)="incQty()"
                            aria-label="Aumentar cantidad"
                          >
                            <app-icon name="plus" [size]="16" />
                          </button>
                        </div>
                      }

                      <button
                        type="button"
                        class="btn btn-dark btn-lg flex-1"
                        [disabled]="!canAdd()"
                        (click)="addToCart()"
                      >
                        <app-icon name="cart" [size]="18" /> Agregar al carrito
                      </button>
                    </div>

                    @if (store.whatsapp()) {
                      <a
                        [href]="waConsult()"
                        target="_blank"
                        rel="noopener"
                        class="btn btn-outline mt-3 w-full"
                      >
                        <app-icon name="whatsapp" [size]="17" class="text-whatsapp" />
                        Consultar por WhatsApp
                      </a>
                    }

                    <!-- Confirmación inline -->
                    @if (added()) {
                      <div
                        class="mt-4 flex flex-col gap-3 rounded-[var(--radius-sm)] bg-brand-soft p-4 animate-in sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span class="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                          <app-icon name="check" [size]="17" class="text-brand" /> Agregado al
                          carrito
                        </span>
                        <a routerLink="/carrito" class="btn btn-dark btn-sm">
                          Ir al carrito ({{ cart.count() }})
                        </a>
                      </div>
                    }
                  } @else {
                    <div class="notice mt-6">
                      <app-icon name="alert" [size]="18" />
                      <span class="font-semibold text-ink">Producto agotado por ahora</span>
                    </div>
                  }
                </div>

                <!-- Confianza -->
                <ul
                  class="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5 text-sm text-ink-soft"
                >
                  @for (b of trust(); track b.text) {
                    <li class="flex items-center gap-2">
                      <app-icon [name]="b.icon" [size]="15" class="shrink-0 text-brand" />
                      {{ b.text }}
                    </li>
                  }
                </ul>

                <!-- Descripción -->
                @if (product.description) {
                  <div class="mt-8 border-t border-line pt-6">
                    <h2 class="meta">Descripción</h2>
                    <p class="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">
                      {{ product.description }}
                    </p>
                  </div>
                }
              </div>
            </div>
          }
        }
      }
    </section>
  `,
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  protected readonly cart = inject(CartService);
  protected readonly store = inject(StoreContextService);
  protected readonly settings = this.store.settings;

  private readonly reload$ = new Subject<void>();
  protected readonly shared = signal(false);

  /** Carga reactiva por slug con estados loading / ok / error (patrón catálogo). */
  protected readonly vm = toSignal(
    combineLatest([
      this.route.paramMap,
      this.reload$.pipe(startWith(undefined)),
    ]).pipe(
      map(([params]) => params.get('slug') ?? ''),
      switchMap((slug) =>
        this.catalog.getProduct(slug).pipe(
          map((product): DetailVm => ({ status: 'ok', product })),
          startWith({ status: 'loading', product: null } as DetailVm),
          catchError((err) =>
            of<DetailVm>({ status: 'error', product: null, message: err?.message }),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', product: null } as DetailVm },
  );

  /**
   * Variante seleccionada. Se recalcula (reset) cuando cambia el producto:
   * primera con stock, o la primera si ninguna tiene. Es escribible por el usuario.
   */
  protected readonly selectedVariant = linkedSignal<Variant | null>(() => {
    const product = this.vm().product;
    if (!product) return null;
    return product.variants.find((v) => v.inStock) ?? product.variants[0] ?? null;
  });

  /**
   * Imagen mostrada. Se recalcula cuando cambia la variante: prioriza la imagen
   * de esa variante, luego la principal, luego la primera. El usuario puede
   * sobrescribirla clicando una miniatura.
   */
  protected readonly selectedImage = linkedSignal<ProductImage | null>(() => {
    const product = this.vm().product;
    if (!product) return null;
    const variant = this.selectedVariant();
    const variantImage = variant
      ? product.images.find((img) => img.idVariant === variant.idVariant)
      : undefined;
    return (
      variantImage ??
      product.images.find((img) => img.isMain) ??
      product.images[0] ??
      null
    );
  });

  /** Cantidad; vuelve a 1 al cambiar de variante. */
  protected readonly qty = linkedSignal<number>(() => {
    this.selectedVariant();
    return 1;
  });

  /** Confirmación "agregado"; se limpia al cambiar de variante. */
  protected readonly added = linkedSignal<boolean>(() => {
    this.selectedVariant();
    return false;
  });

  protected readonly hasAnyStock = computed(() =>
    (this.vm().product?.variants ?? []).some((v) => v.inStock),
  );

  protected readonly canAdd = computed(() => !!this.selectedVariant()?.inStock);

  protected readonly discountPercent = computed(() => {
    const v = this.selectedVariant();
    if (!v || !v.hasDiscount || v.price <= 0) return 0;
    return Math.round(((v.price - v.finalPrice) / v.price) * 100);
  });

  /** Badges de confianza (según lo que ofrezca la tienda). */
  protected readonly trust = computed(() => {
    const s = this.settings();
    const list: { icon: 'shield' | 'whatsapp' | 'truck' | 'store' | 'card'; text: string }[] = [];
    if (s?.allowDelivery) list.push({ icon: 'truck', text: 'Delivery coordinado' });
    if (s?.allowPickup) list.push({ icon: 'store', text: 'Retiro en tienda' });
    list.push({ icon: 'whatsapp', text: 'Cierras por WhatsApp' });
    list.push({ icon: 'shield', text: 'Precio confirmado' });
    return list.slice(0, 4);
  });

  /** Enlace de WhatsApp con el nombre del producto pre-cargado. */
  protected readonly waConsult = computed(() => {
    const num = (this.store.whatsapp() ?? '').replace(/[^\d]/g, '');
    if (!num) return '#';
    const product = this.vm().product;
    const variant = this.selectedVariant();
    const detail = variant ? ` (${variant.name})` : '';
    const text = product
      ? `Hola 👋, me interesa *${product.name}*${detail}. ¿Está disponible?`
      : 'Hola, tengo una consulta.';
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  });

  protected selectVariant(variant: Variant): void {
    if (!variant.inStock) return;
    this.selectedVariant.set(variant);
  }

  protected selectImage(image: ProductImage): void {
    this.selectedImage.set(image);
  }

  protected incQty(): void {
    const max = Math.max(1, this.selectedVariant()?.stock ?? 1);
    this.qty.update((q) => Math.min(q + 1, max));
  }

  protected decQty(): void {
    this.qty.update((q) => Math.max(1, q - 1));
  }

  protected addToCart(): void {
    const product = this.vm().product;
    const variant = this.selectedVariant();
    if (!product || !variant || !variant.inStock) return;
    this.cart.add(product, variant, this.qty());
    this.added.set(true);
  }

  /** Comparte el producto (Web Share API con fallback a copiar el enlace). */
  protected share(product: ProductDetail): void {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.share) {
      nav.share({ title: product.name, url }).catch(() => void 0);
      return;
    }
    nav?.clipboard?.writeText(url).then(
      () => {
        this.shared.set(true);
        setTimeout(() => this.shared.set(false), 2000);
      },
      () => void 0,
    );
  }

  protected retry(): void {
    this.reload$.next();
  }
}
