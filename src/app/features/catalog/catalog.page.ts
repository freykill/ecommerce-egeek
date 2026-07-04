import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { ApiMeta, ProductCard, ProductQuery } from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { IconComponent, IconName, categoryIcon } from '../../shared/ui/icon.component';
import { ProductCardComponent } from '../../shared/ui/product-card.component';

interface CatalogVm {
  status: 'loading' | 'ok' | 'error';
  products: ProductCard[];
  meta: ApiMeta | null;
  query: ProductQuery;
  message?: string;
}

const PAGE_SIZE = 24;

@Component({
  selector: 'app-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent, EmptyStateComponent, IconComponent],
  template: `
    <!-- ============================================================ HOME -->
    @if (!hasFilters()) {
      <!-- ---------------------------------------------------- HERO -->
      <section class="surface-page pt-8 sm:pt-12">
        @if (settings()?.bannerImageUrl; as bg) {
          <!-- Variante con imagen de la tienda -->
          <div class="relative overflow-hidden rounded-[var(--radius-lg)]">
            <img [src]="bg" alt="" class="absolute inset-0 h-full w-full object-cover" />
            <div
              class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent"
            ></div>
            <div
              class="relative flex min-h-[19rem] max-w-xl flex-col justify-center p-7 sm:min-h-[23rem] sm:p-14"
            >
              <p
                class="inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/75"
              >
                <span class="h-px w-5 bg-white/40"></span>
                {{ store.storeName() }}
              </p>
              <h1
                class="mt-4 text-4xl font-[650] leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl"
              >
                {{ heroTitle() }}<span class="text-white/50">.</span>
              </h1>
              <p class="mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/70">
                Explora el catálogo y cierra tu compra por WhatsApp. Sin vueltas.
              </p>
              <div class="mt-7 flex flex-wrap gap-3">
                <a href="#catalogo" class="btn btn-lg bg-surface text-ink hover:bg-surface-sunken">
                  Explorar catálogo
                </a>
                @if (store.whatsapp()) {
                  <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa btn-lg">
                    <app-icon name="whatsapp" [size]="18" /> Escríbenos
                  </a>
                }
              </div>
            </div>
          </div>
        } @else {
          <!-- Variante tipográfica (funciona con cualquier marca) -->
          <div
            class="grid items-center gap-10 border-b border-line pb-10 sm:pb-14 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div class="animate-in">
              <span class="eyebrow">{{ store.storeName() }} · Tienda en línea</span>
              <h1
                class="mt-5 max-w-2xl text-[2.6rem] font-[650] leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl"
              >
                {{ heroTitle() }}<span class="text-brand">.</span>
              </h1>
              <p class="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
                Catálogo actualizado, precios claros y una compra que cierras por WhatsApp.
                Sin vueltas.
              </p>
              <div class="mt-8 flex flex-wrap gap-3">
                <a href="#catalogo" class="btn btn-dark btn-lg">
                  Explorar catálogo <app-icon name="arrow-right" [size]="17" />
                </a>
                @if (store.whatsapp()) {
                  <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-outline btn-lg">
                    <app-icon name="whatsapp" [size]="18" class="text-whatsapp" /> Pide por
                    WhatsApp
                  </a>
                }
              </div>
            </div>

            <!-- Imagen destacada real del catálogo (limpia, sin collage) -->
            @if (heroProduct(); as hp) {
              <a
                [routerLink]="['/producto', hp.slug]"
                class="group relative hidden overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface-muted lg:block"
              >
                <img
                  [src]="hp.mainImage"
                  [alt]="hp.name"
                  class="aspect-square w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
                <span
                  class="absolute bottom-4 left-4 max-w-[80%] truncate rounded-[var(--radius-xs)] bg-surface/95 px-3 py-2 font-mono text-[0.68rem] font-medium uppercase tracking-[0.1em] text-ink"
                >
                  {{ hp.name }}
                </span>
              </a>
            }
          </div>
        }
      </section>

      <!-- ------------------------------------ FRANJA DE BENEFICIOS (marquee) -->
      <section class="surface-page mt-4">
        <div
          class="marquee-wrap no-scrollbar overflow-hidden rounded-[var(--radius)] border border-line bg-surface-muted py-3.5"
        >
          <div class="marquee" aria-hidden="true">
            @for (n of [0, 1]; track n) {
              @for (perk of perks(); track perk.text) {
                <span
                  class="inline-flex items-center gap-2.5 whitespace-nowrap font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-soft"
                >
                  <app-icon [name]="perk.icon" [size]="15" class="shrink-0 text-brand" />
                  {{ perk.text }}
                </span>
                <span
                  class="mx-9 h-[3px] w-[3px] shrink-0 rounded-full bg-line-strong"
                ></span>
              }
            }
          </div>
        </div>
      </section>

      <!-- ------------------------------------------------- CATEGORÍAS -->
      @if (categoryList().length) {
        <section class="surface-page reveal pt-14">
          <div class="mb-6">
            <span class="eyebrow">Explora</span>
            <h2 class="section-title mt-2.5">Compra por categoría</h2>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            @for (cat of categoryList().slice(0, 8); track cat.slug) {
              <a
                routerLink="/"
                [queryParams]="{ category: cat.slug }"
                class="group flex items-center gap-3 rounded-[var(--radius)] border border-line bg-surface p-4 transition-colors duration-200 hover:border-ink"
              >
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)]"
                  [style.background]="chipTint(cat.color)"
                  [style.color]="catColor(cat.color)"
                >
                  <app-icon [name]="catIcon(cat.icon)" [size]="18" />
                </span>
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {{ cat.name }}
                </span>
                <app-icon
                  name="arrow-up-right"
                  [size]="15"
                  class="hidden shrink-0 text-ink-mute transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink sm:block"
                />
              </a>
            }
          </div>
        </section>
      }

      <!-- -------------------------------------------------- DESTACADOS -->
      @if (featured().length) {
        <section class="surface-page reveal pt-14">
          <div class="mb-6 flex items-end justify-between gap-4">
            <div>
              <span class="eyebrow">Selección</span>
              <h2 class="section-title mt-2.5">Destacados de la tienda</h2>
            </div>
            <a href="#catalogo" class="link-arrow hidden sm:inline-flex">
              Ver todo <app-icon name="arrow-right" [size]="15" />
            </a>
          </div>
          <div class="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
            @for (product of featured(); track product.idProduct) {
              <div class="w-[14.5rem] shrink-0 snap-start sm:w-[16rem]">
                <app-product-card [product]="product" />
              </div>
            }
          </div>
        </section>
      }
    }

    <!-- ========================================== RESULTADOS / GRILLA -->
    <section
      id="catalogo"
      class="surface-page scroll-mt-24 py-10"
      [class.pt-14]="!hasFilters()"
    >
      <!-- Encabezado -->
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          @if (!hasFilters()) {
            <span class="eyebrow">Catálogo</span>
          }
          <h2 class="section-title mt-2.5">
            @if (vm().query.search) {
              Resultados para “{{ vm().query.search }}”
            } @else if (categoryName()) {
              {{ categoryName() }}
            } @else if (brandName()) {
              {{ brandName() }}
            } @else {
              Todos los productos
            }
          </h2>
          @if (vm().status === 'ok' && vm().meta) {
            <p class="meta mt-2">{{ vm().meta!.total }} productos</p>
          }
        </div>

        @if (hasFilters()) {
          <a routerLink="/" class="btn btn-outline btn-sm">
            <app-icon name="x" [size]="15" /> Limpiar filtros
          </a>
        }
      </div>

      <!-- Contenido -->
      @switch (vm().status) {
        @case ('loading') {
          <div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            @for (i of skeletons; track i) {
              <div>
                <div class="skeleton aspect-square rounded-[var(--radius)]"></div>
                <div class="space-y-2 pt-3">
                  <div class="skeleton h-3 w-1/3 rounded"></div>
                  <div class="skeleton h-4 w-4/5 rounded"></div>
                  <div class="skeleton h-4 w-1/2 rounded"></div>
                </div>
              </div>
            }
          </div>
        }

        @case ('error') {
          <app-empty-state
            icon="alert"
            tone="danger"
            title="No pudimos cargar los productos"
            [message]="vm().message ?? 'Revisa tu conexión e intenta de nuevo.'"
          >
            <button type="button" class="btn btn-dark" (click)="retry()">Reintentar</button>
          </app-empty-state>
        }

        @case ('ok') {
          @if (vm().products.length === 0) {
            <app-empty-state
              icon="search"
              title="Sin resultados"
              message="No encontramos productos con esos filtros. Prueba con otra búsqueda."
            >
              <a routerLink="/" class="btn btn-dark">Ver todo el catálogo</a>
            </app-empty-state>
          } @else {
            <div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              @for (product of vm().products; track product.idProduct) {
                <app-product-card [product]="product" />
              }
            </div>

            <!-- Paginación -->
            @if (vm().meta && vm().meta!.totalPages > 1) {
              <nav
                class="mt-14 flex items-center justify-between gap-3 border-t border-line pt-6"
              >
                <a
                  class="btn btn-outline btn-sm"
                  [class.pointer-events-none]="vm().meta!.page <= 1"
                  [class.opacity-40]="vm().meta!.page <= 1"
                  routerLink="/"
                  [queryParams]="pageParams(vm().meta!.page - 1)"
                  queryParamsHandling="merge"
                  aria-label="Página anterior"
                >
                  <app-icon name="chevron-left" [size]="15" /> Anterior
                </a>
                <span class="meta">
                  Página {{ vm().meta!.page }} / {{ vm().meta!.totalPages }}
                </span>
                <a
                  class="btn btn-outline btn-sm"
                  [class.pointer-events-none]="vm().meta!.page >= vm().meta!.totalPages"
                  [class.opacity-40]="vm().meta!.page >= vm().meta!.totalPages"
                  routerLink="/"
                  [queryParams]="pageParams(vm().meta!.page + 1)"
                  queryParamsHandling="merge"
                  aria-label="Página siguiente"
                >
                  Siguiente <app-icon name="chevron-right" [size]="15" />
                </a>
              </nav>
            }
          }
        }
      }
    </section>
  `,
})
export class CatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  protected readonly store = inject(StoreContextService);
  protected readonly settings = this.store.settings;

  protected readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  private readonly reload$ = new Subject<void>();

  protected readonly vm = toSignal(
    combineLatest([
      this.route.queryParamMap,
      this.reload$.pipe(startWith(undefined)),
    ]).pipe(
      map(([params]) => this.toQuery(params)),
      switchMap((query) =>
        this.catalog.getProducts(query).pipe(
          map(
            (res): CatalogVm => ({
              status: 'ok',
              products: res.data,
              meta: res.meta,
              query,
            }),
          ),
          startWith({ status: 'loading', products: [], meta: null, query } as CatalogVm),
          catchError((err) =>
            of<CatalogVm>({
              status: 'error',
              products: [],
              meta: null,
              query,
              message: err?.message,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', products: [], meta: null, query: {} } as CatalogVm },
  );

  // Nombres legibles para categoría/marca a partir del slug del filtro.
  protected readonly categoryList = toSignal(
    this.catalog.getCategories().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  private readonly brands = toSignal(
    this.catalog.getBrands().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly hasFilters = computed(() => {
    const q = this.vm().query;
    return !!(q.search || q.category || q.brand);
  });

  /** Titular del hero sin punto final (el punto lo pinta la marca). */
  protected readonly heroTitle = computed(() => {
    const text = this.settings()?.bannerText || 'Todo lo que buscas, en un solo lugar';
    return text.replace(/[.\s]+$/, '');
  });

  /** Beneficios de la franja (según lo que ofrezca la tienda). */
  protected readonly perks = computed(() => {
    const s = this.settings();
    const list: { icon: IconName; text: string }[] = [
      { icon: 'whatsapp', text: 'Pedido por WhatsApp' },
    ];
    if (s?.allowDelivery) list.push({ icon: 'truck', text: 'Delivery coordinado' });
    if (s?.allowPickup) list.push({ icon: 'store', text: 'Retiro en tienda' });
    list.push({ icon: 'shield', text: 'Precios confirmados' });
    list.push({ icon: 'bolt', text: 'Respuesta rápida' });
    return list.slice(0, 4);
  });

  /** Primer producto con foto: imagen destacada del hero. */
  protected readonly heroProduct = computed(
    () => this.vm().products.find((p) => p.mainImage) ?? null,
  );

  /** Productos destacados de la página actual (fila "Destacados"). */
  protected readonly featured = computed(() =>
    this.vm()
      .products.filter((p) => p.isFeatured && p.inStock)
      .slice(0, 10),
  );

  protected readonly categoryName = computed(() => {
    const slug = this.vm().query.category;
    return slug ? (this.categoryList().find((c) => c.slug === slug)?.name ?? slug) : null;
  });

  protected readonly brandName = computed(() => {
    const slug = this.vm().query.brand;
    return slug ? (this.brands().find((b) => b.slug === slug)?.name ?? slug) : null;
  });

  protected readonly waLink = computed(() => {
    const num = (this.store.whatsapp() ?? '').replace(/[^\d]/g, '');
    return num ? `https://wa.me/${num}` : '#';
  });

  // -------- Presentación de categorías (color/ícono reales del backend) --------

  /** Color de acento de la categoría (cae en el color de marca si viene vacío). */
  protected catColor(color: string | null): string {
    return color || 'var(--brand-primary)';
  }

  /** Ícono del set propio a partir de la clase PrimeIcons del backend. */
  protected catIcon(icon: string | null): IconName {
    return categoryIcon(icon);
  }

  /** Fondo del chip del ícono: tinte sutil del color de la categoría. */
  protected chipTint(color: string | null): string {
    return `color-mix(in srgb, ${this.catColor(color)} 11%, var(--surface))`;
  }

  protected retry(): void {
    this.reload$.next();
  }

  protected pageParams(page: number): Record<string, number> {
    return { page };
  }

  private toQuery(params: ParamMap): ProductQuery {
    const page = Number(params.get('page'));
    return {
      search: params.get('search') ?? undefined,
      category: params.get('category') ?? undefined,
      brand: params.get('brand') ?? undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: PAGE_SIZE,
    };
  }
}
